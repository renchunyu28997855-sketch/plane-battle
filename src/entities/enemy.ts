/**
 * 敌人实体
 */

import type { GameConfig, Rect, EnemyType, LevelConfig } from '../types';
import { checkCollision, randomInt } from '../utils';

/**
 * 敌人类型配置
 */
const ENEMY_CONFIGS: Record<EnemyType, { width: number; height: number; health: number; speed: number; score: number; color: string }> = {
  normal: { width: 30, height: 30, health: 1, speed: 2, score: 10, color: '#e74c3c' },
  fast: { width: 25, height: 25, health: 1, speed: 4, score: 20, color: '#9b59b6' },
  heavy: { width: 45, height: 45, health: 3, speed: 1, score: 30, color: '#8e44ad' },
  boss: { width: 80, height: 80, health: 20, speed: 1.5, score: 500, color: '#c0392b' },
  elite: { width: 35, height: 35, health: 3, speed: 5, score: 50, color: '#e67e22' },
  shielded: { width: 40, height: 40, health: 2, speed: 2, score: 40, color: '#3498db' },
  bomber: { width: 50, height: 50, health: 2, speed: 1, score: 60, color: '#7f8c8d' },
};

/**
 * 敌人类
 */
export class Enemy {
  // 位置
  x: number;
  y: number;

  // 尺寸
  readonly width: number;
  readonly height: number;

  // 属性
  health: number;
  maxHealth: number;
  speed: number;
  score: number;
  type: EnemyType;

  // 激活状态
  active = true;

  // 射击冷却
  private shootCooldown = 0;
  private shootInterval = 0;

  // 游戏配置
  private config: GameConfig;

  // 构造函数
  constructor(x: number, y: number, type: EnemyType, config: GameConfig, levelConfig?: LevelConfig) {
    const enemyConfig = ENEMY_CONFIGS[type];

    this.x = x;
    this.y = y;
    this.type = type;
    this.width = enemyConfig.width;
    this.height = enemyConfig.height;
    this.maxHealth = enemyConfig.health;
    this.health = enemyConfig.health;
    this.speed = enemyConfig.speed * (levelConfig?.enemySpeed ?? 1);
    this.score = enemyConfig.score;
    this.config = config;

    // Boss 射击更快
    this.shootInterval = type === 'boss' ? 1500 : randomInt(2000, 4000);
  }

  // 更新
  update(deltaTime: number): void {
    if (!this.active) return;

    // 向下移动
    this.y += this.speed * (deltaTime / 16);

    // 射击冷却
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }
  }

  // 检查是否可以射击
  canShoot(): boolean {
    return this.active && this.shootCooldown <= 0;
  }

  // 开始射击冷却
  startShooting(): void {
    this.shootCooldown = this.shootInterval;
  }

  // 受伤
  takeDamage(damage: number): void {
    this.health -= damage;
    if (this.health < 0) {
      this.health = 0;
    }
  }

  // 是否被摧毁
  isDestroyed(): boolean {
    return this.health <= 0;
  }

  // 摧毁
  destroy(): void {
    this.active = false;
  }

  // 是否超出边界
  isOutOfBounds(): boolean {
    return this.y > this.config.canvasHeight + this.height;
  }

  // 获取碰撞矩形
  getRect(): Rect {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  // 检查碰撞
  checkCollision(target: { getRect: () => Rect }): boolean {
    return checkCollision(this.getRect(), target.getRect());
  }

  // 渲染
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const enemyConfig = ENEMY_CONFIGS[this.type];

    // 绘制敌人主体
    ctx.fillStyle = enemyConfig.color;

    // 根据类型绘制不同形状
    switch (this.type) {
      case 'normal':
        this.drawNormalEnemy(ctx);
        break;
      case 'fast':
        this.drawFastEnemy(ctx);
        break;
      case 'heavy':
        this.drawHeavyEnemy(ctx);
        break;
      case 'boss':
        this.drawBossEnemy(ctx);
        break;
      case 'elite':
        this.drawEliteEnemy(ctx);
        break;
      case 'shielded':
        this.drawShieldedEnemy(ctx);
        break;
      case 'bomber':
        this.drawBomberEnemy(ctx);
        break;
    }

    // 绘制血条
    this.drawHealthBar(ctx);
  }

  // 绘制普通敌人
  private drawNormalEnemy(ctx: CanvasRenderingContext2D): void {
    // 倒三角形
    ctx.beginPath();
    ctx.moveTo(this.x - this.width / 2, this.y - this.height / 2);
    ctx.lineTo(this.x + this.width / 2, this.y - this.height / 2);
    ctx.lineTo(this.x, this.y + this.height / 2);
    ctx.closePath();
    ctx.fill();
  }

  // 绘制快速敌人
  private drawFastEnemy(ctx: CanvasRenderingContext2D): void {
    // 菱形
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.height / 2);
    ctx.lineTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x, this.y + this.height / 2);
    ctx.lineTo(this.x - this.width / 2, this.y);
    ctx.closePath();
    ctx.fill();
  }

  // 绘制重型敌人
  private drawHeavyEnemy(ctx: CanvasRenderingContext2D): void {
    // 六边形
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = this.x + (this.width / 2) * Math.cos(angle);
      const y = this.y + (this.height / 2) * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }

  // 绘制Boss
  private drawBossEnemy(ctx: CanvasRenderingContext2D): void {
    // 大倒三角形
    ctx.beginPath();
    ctx.moveTo(this.x - this.width / 2, this.y - this.height / 2);
    ctx.lineTo(this.x + this.width / 2, this.y - this.height / 2);
    ctx.lineTo(this.x, this.y + this.height / 2);
    ctx.closePath();
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x - 15, this.y, 8, 0, Math.PI * 2);
    ctx.arc(this.x + 15, this.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(this.x - 15, this.y, 4, 0, Math.PI * 2);
    ctx.arc(this.x + 15, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制精英敌人
  private drawEliteEnemy(ctx: CanvasRenderingContext2D): void {
    // 更大的倒三角形，带有红色光环
    ctx.beginPath();
    ctx.moveTo(this.x - this.width / 2, this.y - this.height / 2);
    ctx.lineTo(this.x + this.width / 2, this.y - this.height / 2);
    ctx.lineTo(this.x, this.y + this.height / 2);
    ctx.closePath();
    ctx.fill();

    // 红色光环
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2 + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // 绘制护盾敌人
  private drawShieldedEnemy(ctx: CanvasRenderingContext2D): void {
    // 蓝色圆形主体
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // 蓝色护盾圆圈
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2 + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    // 护盾裂纹
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x - 10, this.y - 15);
    ctx.lineTo(this.x + 5, this.y);
    ctx.lineTo(this.x - 5, this.y + 15);
    ctx.stroke();
  }

  // 绘制轰炸机敌人
  private drawBomberEnemy(ctx: CanvasRenderingContext2D): void {
    // 灰色方形主体
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

    // 炸弹标记
    ctx.fillStyle = '#e74c3c';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💣', this.x, this.y);

    // 引信
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.height / 2);
    ctx.lineTo(this.x, this.y - this.height / 2 - 10);
    ctx.stroke();
  }

  // 绘制血条
  private drawHealthBar(ctx: CanvasRenderingContext2D): void {
    if (this.maxHealth <= 1) return;

    const barWidth = this.width;
    const barHeight = 4;
    const startX = this.x - barWidth / 2;
    const startY = this.y - this.height / 2 - 10;

    // 背景bar
    ctx.fillStyle = '#555555';
    ctx.fillRect(startX, startY, barWidth, barHeight);

    // 血量
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = healthPercent > 0.3 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(startX, startY, barWidth * healthPercent, barHeight);
  }
}
