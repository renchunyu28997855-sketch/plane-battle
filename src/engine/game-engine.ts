/**
 * 游戏引擎核心
 */

import type { GameState, GameConfig, LevelConfig, KeyState } from '../types';
import { DEFAULT_GAME_CONFIG, LEVEL_CONFIGS } from '../types';
import { clamp, randomInt } from '../utils';
import type { PropType } from '../entities/prop';
import { Player } from '../entities/player';
import { BulletManager } from '../entities/bullet-manager';
import { EnemyManager } from '../entities/enemy-manager';
import { PropManager } from '../entities/prop-manager';
import { soundManager } from '../systems/sound-manager';

/**
 * 游戏引擎 - 核心控制器
 */
export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private config: GameConfig;
  private state: GameState = 'menu';
  private score = 0;
  private currentLevel = 1;
  private levelConfig: LevelConfig;
  private player: Player;
  private bulletManager: BulletManager;
  private enemyManager: EnemyManager;
  private propManager: PropManager;
  private keys: KeyState = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
  };
  private animationId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDeltaTime = 1000 / 60;
  private spawnTimer = 0;
  private enemiesSpawned = 0;
  private levelTimer = 0; // 关卡剩余时间（秒）
  private buffMessage = ''; // Buff 提示消息
  private buffMessageTimer = 0; // Buff 消息显示时间

  constructor(canvas: HTMLCanvasElement, config: Partial<GameConfig> = {}) {
    this.ctx = canvas.getContext('2d')!;
    this.config = { ...DEFAULT_GAME_CONFIG, ...config };
    this.levelConfig = { ...LEVEL_CONFIGS[0] };
    
    this.player = new Player(
      this.config.canvasWidth / 2,
      this.config.canvasHeight - 80,
      this.config
    );
    this.bulletManager = new BulletManager(this.config);
    this.enemyManager = new EnemyManager(this.config);
    this.propManager = new PropManager(this.config);
    
    this.bindEvents();
  }
  
  private bindEvents(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'ArrowUp') this.keys.ArrowUp = true;
    if (e.code === 'ArrowDown') this.keys.ArrowDown = true;
    if (e.code === 'ArrowLeft') this.keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') this.keys.ArrowRight = true;
    if (e.code === 'Space') this.keys.Space = true;
    
    if (this.state === 'menu' && e.code === 'Space') {
      this.startGame();
    }
    if (this.state === 'gameOver' && e.code === 'Space') {
      this.restartGame();
    }
    if (this.state === 'levelComplete' && e.code === 'Space') {
      this.nextLevel();
    }
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
  }
  
  private handleKeyUp(e: KeyboardEvent): void {
    if (e.code === 'ArrowUp') this.keys.ArrowUp = false;
    if (e.code === 'ArrowDown') this.keys.ArrowDown = false;
    if (e.code === 'ArrowLeft') this.keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') this.keys.ArrowRight = false;
    if (e.code === 'Space') this.keys.Space = false;
  }
  
  startGame(): void {
    this.state = 'playing';
    this.score = 0;
    this.currentLevel = 1;
    this.loadLevel(1);
    this.startLoop();
  }
  
  restartGame(): void {
    this.player.reset(
      this.config.canvasWidth / 2,
      this.config.canvasHeight - 80
    );
    this.bulletManager.clear();
    this.enemyManager.clear();
    this.propManager.clear();
    this.startGame();
  }
  
  nextLevel(): void {
    // 清理上一关的敌机和子弹
    this.enemyManager.clear();
    this.bulletManager.clear();
    
    if (this.currentLevel < LEVEL_CONFIGS.length) {
      this.currentLevel++;
      this.loadLevel(this.currentLevel);
      this.state = 'playing';
    } else {
      this.state = 'gameOver';
    }
  }
  
  private loadLevel(level: number): void {
    // 克隆关卡配置，避免修改原始数据
    this.levelConfig = { ...LEVEL_CONFIGS[level - 1] };
    this.spawnTimer = 0;
    this.enemiesSpawned = 0;
    this.levelTimer = this.levelConfig.levelTime; // 初始化关卡计时器
    
    // 根据关卡时间和敌机数量动态计算刷新间隔
    // 确保在关卡时间内均匀刷完所有敌机
    const calculatedInterval = (this.levelConfig.levelTime * 1000) / this.levelConfig.enemyCount;
    this.levelConfig.spawnInterval = Math.floor(calculatedInterval);
    
    this.enemyManager.setLevelConfig(this.levelConfig);
    this.player.reset(
      this.config.canvasWidth / 2,
      this.config.canvasHeight - 80
    );
  }
  
  private startLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }
  
  private loop(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulator += deltaTime;
    
    while (this.accumulator >= this.fixedDeltaTime) {
      this.update(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }
    
    this.render();
    
    this.animationId = requestAnimationFrame((time) => this.loop(time));
  }
  
  private update(deltaTime: number): void {
    if (this.state !== 'playing') return;
    
    // 更新关卡计时器
    this.levelTimer -= deltaTime / 1000;
    
    // 更新 buff 消息计时器
    if (this.buffMessageTimer > 0) {
      this.buffMessageTimer -= deltaTime;
    }
    
    this.updatePlayer(deltaTime);
    this.player.update(deltaTime);
    this.bulletManager.update(deltaTime);
    this.enemyManager.update(deltaTime);
    this.propManager.update(deltaTime);
    this.updateSpawning(deltaTime);
    this.updateEnemyShooting();
    this.updateTrackingBullets();
    this.checkCollisions();
    this.checkGameState();
  }
  
  private updatePlayer(_deltaTime: number): void {
    let dx = 0;
    let dy = 0;
    const speed = this.config.playerSpeed;
    
    if (this.keys.ArrowUp) dy -= speed;
    if (this.keys.ArrowDown) dy += speed;
    if (this.keys.ArrowLeft) dx -= speed;
    if (this.keys.ArrowRight) dx += speed;
    
    const newX = this.player.x + dx;
    const newY = this.player.y + dy;
    
    this.player.x = clamp(newX, this.player.width / 2, this.config.canvasWidth - this.player.width / 2);
    this.player.y = clamp(newY, this.player.height / 2, this.config.canvasHeight - this.player.height / 2);
    
    this.player.shoot(this.bulletManager);
  }
  
  private updateSpawning(deltaTime: number): void {
    if (this.enemiesSpawned >= this.levelConfig.enemyCount) return;
    
    this.spawnTimer += deltaTime;
    
    if (this.spawnTimer >= this.levelConfig.spawnInterval) {
      this.spawnTimer = 0;
      this.enemyManager.spawn(this.config.canvasWidth);
      this.enemiesSpawned++;
    }
  }
  
  private updateEnemyShooting(): void {
    const enemies = this.enemyManager.getEnemies();
    
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      if (enemy.canShoot()) {
        this.bulletManager.createEnemyBullet(enemy.x, enemy.y + enemy.height / 2);
        enemy.startShooting();
        soundManager.play('enemyShoot');
      }
    }
  }
  
  private updateTrackingBullets(): void {
    const enemies = this.enemyManager.getEnemies();
    this.bulletManager.updateTrackingTargets(enemies);
  }
  
  private checkCollisions(): void {
    const playerBullets = this.bulletManager.getPlayerBullets();
    const enemies = this.enemyManager.getEnemies();
    
    for (const bullet of playerBullets) {
      for (const enemy of enemies) {
        if (bullet.active && enemy.active && bullet.checkCollision(enemy.getRect())) {
          bullet.active = false;
          enemy.takeDamage(bullet.damage);
          
          if (enemy.isDestroyed()) {
            // 30% 概率生成道具
            if (randomInt(1, 100) <= 30) {
              this.propManager.spawnRandom(enemy.x, enemy.y);
            }
            enemy.destroy();
            soundManager.play('explosion');
            this.score += enemy.score;
          }
        }
      }
    }
    
    const enemyBullets = this.bulletManager.getEnemyBullets();
    for (const bullet of enemyBullets) {
      if (bullet.active && bullet.checkCollision(this.player.getRect())) {
        bullet.active = false;
        this.player.takeDamage(bullet.damage);
      }
    }
    
    for (const enemy of enemies) {
      if (enemy.active && enemy.checkCollision(this.player)) {
        // 30% 概率生成道具
        if (randomInt(1, 100) <= 30) {
          this.propManager.spawnRandom(enemy.x, enemy.y);
        }
        enemy.destroy();
        this.player.takeDamage(1);
      }
    }
    
    // 检查玩家与道具的碰撞
    const props = this.propManager.getProps();
    for (const prop of props) {
      if (prop.active && prop.checkCollision(this.player)) {
        prop.active = false;
        this.applyPropEffect(prop.type);
      }
    }
  }
  
  // 应用道具效果
  private applyPropEffect(type: PropType): void {
    const level = this.player.bulletLevel;
    
    switch (type) {
      case 'shield':
        this.player.applyShield();
        this.showBuffMessage(`护盾 +1`);
        break;
      case 'normal':
        this.player.applyNormal();
        this.showBuffMessage(`普通 Lv.${level}`);
        break;
      case 'spread':
        this.player.applySpread();
        this.showBuffMessage(`散弹 Lv.${this.player.bulletLevel}`);
        break;
      case 'tracking':
        this.player.applyTracking();
        this.showBuffMessage(`追踪 Lv.${this.player.bulletLevel}`);
        break;
      case 'laser':
        this.player.applyLaser();
        this.showBuffMessage(`激光 Lv.${this.player.bulletLevel}`);
        break;
      case 'score':
        this.score += 100;
        this.showBuffMessage('金币 +100');
        break;
    }
  }

  // 显示 buff 消息
  private showBuffMessage(message: string): void {
    this.buffMessage = message;
    this.buffMessageTimer = 1500; // 显示 1.5 秒
  }
  
  private checkGameState(): void {
    // 先检查玩家是否死亡
    if (this.player.isDestroyed()) {
      soundManager.play('explosion'); // 玩家爆炸音效
      this.state = 'gameOver';
      return;
    }
    
    // 检查是否通关：所有敌机生成完毕 AND 屏幕上没有敌机
    const enemiesOnScreen = this.enemyManager.getEnemies().length;
    const allSpawned = this.enemiesSpawned >= this.levelConfig.enemyCount;
    
    if (allSpawned && enemiesOnScreen === 0) {
      this.state = 'levelComplete';
    }
  }
  
  render(): void {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
    
    switch (this.state) {
      case 'menu':
        this.renderMenu();
        break;
      case 'playing':
        this.renderGame();
        this.renderUI();
        break;
      case 'levelComplete':
        this.renderGame();
        this.renderUI();
        this.renderLevelComplete();
        break;
      case 'gameOver':
        this.renderGame();
        this.renderUI();
        this.renderGameOver();
        break;
    }
  }
  
  private renderGame(): void {
    this.enemyManager.render(this.ctx);
    this.bulletManager.render(this.ctx);
    this.propManager.render(this.ctx);
    this.player.render(this.ctx);
  }
  
  private renderUI(): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`分数: ${this.score}`, 10, 25);
    this.ctx.fillText(`生命: ${this.player.health}`, 10, 50);
    this.ctx.fillText(`关卡: ${this.currentLevel}/5`, 10, 75);
    this.ctx.fillText(`时间: ${Math.ceil(this.levelTimer)}秒`, 10, 100);
    
    // Buff 消息提示（屏幕中央）
    if (this.buffMessageTimer > 0) {
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#ffff00';
      this.ctx.font = '24px Arial';
      this.ctx.fillText(this.buffMessage, this.config.canvasWidth / 2, this.config.canvasHeight / 2 - 100);
    }
    
    // 右侧Buff状态显示
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'right';
    let buffY = 25;
    
    // 护盾
    if (this.player.shield > 0) {
      this.ctx.fillStyle = '#00ffff';
      this.ctx.fillText(`护盾: ${this.player.shield}`, this.config.canvasWidth - 10, buffY);
      buffY += 20;
    }
    
    // 子弹类型和等级
    if (this.player.bulletLevel > 0) {
      const bulletTypeNames: Record<string, string> = {
        normal: '普通',
        spread: '散弹',
        tracking: '追踪',
        laser: '激光',
      };
      const typeName = bulletTypeNames[this.player.bulletType] || '普通';
      const bulletColors: Record<string, string> = {
        normal: '#f1c40f',
        spread: '#9b59b6',
        tracking: '#00ffff',
        laser: '#e74c3c',
      };
      this.ctx.fillStyle = bulletColors[this.player.bulletType] || '#f1c40f';
      this.ctx.fillText(`${typeName}: Lv.${this.player.bulletLevel}`, this.config.canvasWidth - 10, buffY);
    }
  }
  
  private renderMenu(): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('飞机大战', this.config.canvasWidth / 2, this.config.canvasHeight / 2 - 50);
    this.ctx.font = '20px Arial';
    this.ctx.fillText('按空格键开始', this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 20);
    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = '#888888';
    this.ctx.fillText('方向键移动，空格键射击', this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 60);
  }
  
  private renderLevelComplete(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
    this.ctx.fillStyle = '#00ff00';
    this.ctx.font = '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('关卡完成!', this.config.canvasWidth / 2, this.config.canvasHeight / 2 - 30);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`得分: ${this.score}`, this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 20);
    this.ctx.font = '16px Arial';
    this.ctx.fillText('按空格键进入下一关', this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 60);
  }
  
  private renderGameOver(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
    this.ctx.fillStyle = '#ff0000';
    this.ctx.font = '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏结束', this.config.canvasWidth / 2, this.config.canvasHeight / 2 - 30);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`最终得分: ${this.score}`, this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 20);
    if (this.currentLevel >= 5) {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.fillText('恭喜通关!', this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 50);
    }
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#888888';
    this.ctx.fillText('按空格键重新开始', this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 90);
  }
  
  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
