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
  
  // 护盾（可叠加）
  shield = 0;
  
  // 速度加成（可叠加，每层减少15%射击间隔，最高5层）
  speedLevel = 0;
  
  // 散弹层数（可叠加，最高3层）
  multiShotLevel = 0;
  
  // 力量加成（可叠加，每层+1伤害）
  powerLevel = 0;
  
  // 射击冷却
  private shootCooldown = 0;
  private baseShootInterval = 100; // 基础射击间隔（毫秒）
  
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
    this.speedLevel = 0;
    this.multiShotLevel = 0;
    this.powerLevel = 0;
    this.shootCooldown = 0;
  }

  // 射击
  shoot(bulletManager: BulletManager): void {
    if (this.shootCooldown <= 0) {
      // 根据multiShotLevel决定发射方式
      if (this.multiShotLevel >= 2) {
        // 3发散弹
        bulletManager.createSpreadBullet(this.x, this.y - this.height / 2);
      } else if (this.multiShotLevel >= 1) {
        // 2发散弹
        bulletManager.createSpreadBullet(this.x, this.y - this.height / 2);
      } else {
        bulletManager.createPlayerBullet(this.x, this.y - this.height / 2);
      }
      
      // 根据speedLevel计算射击间隔（每层减少15%）
      const interval = this.baseShootInterval * (1 - this.speedLevel * 0.15);
      this.shootCooldown = Math.max(20, interval); // 最低20ms
      soundManager.play('shoot');
    }
  }

  // 更新
  update(deltaTime: number): void {
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
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

  // 应用护盾效果（可叠加）
  applyShield(): void {
    this.shield++;
  }

  // 应用速度效果（可叠加，最高5层）
  applySpeed(): void {
    if (this.speedLevel < 5) {
      this.speedLevel++;
    }
  }

  // 应用散弹效果（可叠加，最高3层）
  applyMultiShot(): void {
    if (this.multiShotLevel < 3) {
      this.multiShotLevel++;
    }
  }

  // 应用力量效果（可叠加，每层+1伤害）
  applyPower(): void {
    this.powerLevel++;
  }

  // 获取伤害倍数
  getDamageMultiplier(): number {
    return 1 + this.powerLevel;
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
    
    // 绘制Buff指示器
    this.drawBuffIndicators(ctx);
    
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

  // 绘制Buff指示器
  private drawBuffIndicators(ctx: CanvasRenderingContext2D): void {
    const startX = this.x - 40;
    let indicatorY = this.y - this.height / 2 - 15;
    
    // 护盾显示
    if (this.shield > 0) {
      ctx.fillStyle = '#00ffff';
      ctx.font = '12px Arial';
      ctx.fillText(`护盾x${this.shield}`, startX, indicatorY);
      indicatorY -= 15;
    }
    
    // 速度显示
    if (this.speedLevel > 0) {
      ctx.fillStyle = '#ffff00';
      ctx.font = '12px Arial';
      ctx.fillText(`加速x${this.speedLevel}`, startX, indicatorY);
      indicatorY -= 15;
    }
    
    // 散弹显示
    if (this.multiShotLevel > 0) {
      ctx.fillStyle = '#9b59b6';
      ctx.font = '12px Arial';
      ctx.fillText(`散弹x${this.multiShotLevel}`, startX, indicatorY);
      indicatorY -= 15;
    }
    
    // 力量显示
    if (this.powerLevel > 0) {
      ctx.fillStyle = '#e74c3c';
      ctx.font = '12px Arial';
      ctx.fillText(`力量x${this.powerLevel}`, startX, indicatorY);
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
