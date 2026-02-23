/**
 * 玩家飞机实体
 */

import type { GameConfig, Rect } from '../types';
import { checkCollision } from '../utils';
import type { BulletManager } from './bullet-manager';
import { soundManager } from '../systems/sound-manager';

/**
 * 玩家飞机类
 */
export class Player {
  // 位置和尺寸
  x: number;
  y: number;
  readonly width = 40;
  readonly height = 50;
  
  // 生命值
  health = 3;
  maxHealth = 3;
  
  // 护盾
  shield = 0;
  
  // 射击冷却
  private shootCooldown = 0;
  private baseShootInterval = 100; // 基础射击间隔（毫秒）
  private currentShootInterval = 100; // 当前射击间隔
  
  // 子弹类型
  private bulletType: 'normal' | 'spread' = 'normal';
  private bulletTypeTimer = 0;
  
  // 子弹伤害倍数
  private damageMultiplier = 1;
  private damageTimer = 0;
  
  // 构造函数
  constructor(x: number, y: number, config: GameConfig) {
    this.x = x;
    this.y = y;
    this.maxHealth = config.playerHealth;
    this.health = config.playerHealth;
  }
  
  // 重置玩家状态
  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.health = this.maxHealth;
    this.shield = 0;
    this.shootCooldown = 0;
    this.currentShootInterval = this.baseShootInterval;
    this.bulletType = 'normal';
    this.bulletTypeTimer = 0;
    this.damageMultiplier = 1;
    this.damageTimer = 0;
  }
  
  // 射击
  shoot(bulletManager: BulletManager): void {
    if (this.shootCooldown <= 0) {
      if (this.bulletType === 'spread') {
        bulletManager.createSpreadBullet(this.x, this.y - this.height / 2);
      } else {
        bulletManager.createPlayerBullet(this.x, this.y - this.height / 2);
      }
      this.shootCooldown = this.currentShootInterval;
      soundManager.play('shoot');
    }
  }
  
  // 更新
  update(deltaTime: number): void {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }
    
    // 更新子弹类型计时器
    if (this.bulletTypeTimer > 0) {
      this.bulletTypeTimer -= deltaTime;
      if (this.bulletTypeTimer <= 0) {
        this.bulletType = 'normal';
      }
    }
    
    // 更新伤害倍数计时器
    if (this.damageTimer > 0) {
      this.damageTimer -= deltaTime;
      if (this.damageTimer <= 0) {
        this.damageMultiplier = 1;
      }
    }
  }
  
  // 受伤
  takeDamage(damage: number): void {
    // 如果有护盾，优先消耗护盾
    if (this.shield > 0) {
      this.shield--;
      return;
    }
    this.health -= damage;
    if (this.health < 0) {
      this.health = 0;
    }
  }
  
  // 应用护盾效果
  applyShield(): void {
    this.shield++;
  }
  
  // 应用速度效果
  applySpeed(duration: number): void {
    this.currentShootInterval = this.baseShootInterval * 0.5; // 射击速度翻倍
    // 5秒后恢复
    setTimeout(() => {
      this.currentShootInterval = this.baseShootInterval;
    }, duration);
  }
  
  // 应用散弹效果
  applyMultiShot(duration: number): void {
    this.bulletType = 'spread';
    this.bulletTypeTimer = duration;
  }
  
  // 应用力量效果
  applyPower(duration: number): void {
    this.damageMultiplier = 2;
    this.damageTimer = duration;
  }
  
  // 获取伤害倍数
  getDamageMultiplier(): number {
    return this.damageMultiplier;
  }
  
  // 是否被摧毁
  isDestroyed(): boolean {
    return this.health <= 0;
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
  checkCollision(other: { getRect: () => Rect }): boolean {
    return checkCollision(this.getRect(), other.getRect());
  }
  
  // 渲染
  render(ctx: CanvasRenderingContext2D): void {
    // 绘制飞机主体
    this.drawBody(ctx);
    
    // 绘制生命值指示器
    this.drawHealthIndicator(ctx);
  }
  
  // 绘制飞机主体
  private drawBody(ctx: CanvasRenderingContext2D): void {
    // 机身
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.height / 2); // 顶部
    ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2); // 左下
    ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2); // 右下
    ctx.closePath();
    ctx.fill();
    
    // 驾驶舱
    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y - 5, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 引擎火焰
    if (Math.random() > 0.5) {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(this.x - 5, this.y + this.height / 2);
      ctx.lineTo(this.x, this.y + this.height / 2 + 15);
      ctx.lineTo(this.x + 5, this.y + this.height / 2);
      ctx.closePath();
      ctx.fill();
    }
  }
  
  // 绘制生命值指示器
  private drawHealthIndicator(ctx: CanvasRenderingContext2D): void {
    const indicatorWidth = 30;
    const indicatorHeight = 4;
    const startX = this.x - indicatorWidth / 2;
    const startY = this.y + this.height / 2 + 10;
    
    // 背景
    ctx.fillStyle = '#555555';
    ctx.fillRect(startX, startY, indicatorWidth, indicatorHeight);
    
    // 生命值
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = healthPercent > 0.3 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(startX, startY, indicatorWidth * healthPercent, indicatorHeight);
  }
}
