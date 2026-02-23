/**
 * 游戏引擎核心
 */

import type { GameState, GameConfig, LevelConfig, KeyState } from '../types';
import { DEFAULT_GAME_CONFIG, LEVEL_CONFIGS } from '../types';
import { clamp } from '../utils';
import { Player } from '../entities/player';
import { BulletManager } from '../entities/bullet-manager';
import { EnemyManager } from '../entities/enemy-manager';
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

  constructor(canvas: HTMLCanvasElement, config: Partial<GameConfig> = {}) {
    this.ctx = canvas.getContext('2d')!;
    this.config = { ...DEFAULT_GAME_CONFIG, ...config };
    this.levelConfig = LEVEL_CONFIGS[0];
    
    this.player = new Player(
      this.config.canvasWidth / 2,
      this.config.canvasHeight - 80,
      this.config
    );
    this.bulletManager = new BulletManager(this.config);
    this.enemyManager = new EnemyManager(this.config);
    
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
    this.startGame();
  }
  
  nextLevel(): void {
    if (this.currentLevel < LEVEL_CONFIGS.length) {
      this.currentLevel++;
      this.loadLevel(this.currentLevel);
      this.state = 'playing';
    } else {
      this.state = 'gameOver';
    }
  }
  
  private loadLevel(level: number): void {
    this.levelConfig = LEVEL_CONFIGS[level - 1];
    this.spawnTimer = 0;
    this.enemiesSpawned = 0;
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
    
    this.updatePlayer(deltaTime);
    this.player.update(deltaTime);
    this.bulletManager.update(deltaTime);
    this.enemyManager.update(deltaTime);
    this.updateSpawning(deltaTime);
    this.updateEnemyShooting();
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
  
  private checkCollisions(): void {
    const playerBullets = this.bulletManager.getPlayerBullets();
    const enemies = this.enemyManager.getEnemies();
    
    for (const bullet of playerBullets) {
      for (const enemy of enemies) {
        if (bullet.active && enemy.active && bullet.checkCollision(enemy)) {
          bullet.active = false;
          enemy.takeDamage(bullet.damage);
          
          if (enemy.isDestroyed()) {
            enemy.destroy();
            this.score += enemy.score;
          }
        }
      }
    }
    
    const enemyBullets = this.bulletManager.getEnemyBullets();
    for (const bullet of enemyBullets) {
      if (bullet.active && bullet.checkCollision(this.player)) {
        bullet.active = false;
        this.player.takeDamage(bullet.damage);
      }
    }
    
    for (const enemy of enemies) {
      if (enemy.active && enemy.checkCollision(this.player)) {
        enemy.destroy();
        this.player.takeDamage(1);
      }
    }
  }
  
  private checkGameState(): void {
    if (this.player.isDestroyed()) {
      this.state = 'gameOver';
    }
    
    if (this.enemiesSpawned >= this.levelConfig.enemyCount && 
        this.enemyManager.getEnemies().length === 0) {
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
    this.player.render(this.ctx);
  }
  
  private renderUI(): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`分数: ${this.score}`, 10, 25);
    this.ctx.fillText(`生命: ${this.player.health}`, 10, 50);
    this.ctx.fillText(`关卡: ${this.currentLevel}/3`, 10, 75);
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
    if (this.currentLevel >= 3) {
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
