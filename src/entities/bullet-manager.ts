/**
 * 子弹管理器
 */

import type { GameConfig, Rect } from '../types';
import { checkCollision } from '../utils';

// 普通子弹大小倍数
const NORMAL_BULLET_SIZES = [1, 2, 4, 7, 10];
// 散弹子弹数量
const SPREAD_BULLET_COUNTS = [2, 3, 4, 5, 6];
// 散弹基础大小（每级增加）
const SPREAD_BULLET_BASE_SIZE = [6, 8, 10, 12, 14];

/**
 * 子弹类
 */
export class Bullet {
  // 位置
  x: number;
  y: number;
  
  // 尺寸
  width: number;
  height: number;
  
  // 速度
  speed: number;
  
  // 横向速度（用于散弹和跟踪弹）
  vx = 0;
  
  // 伤害
  readonly damage: number;
  
  // 激活状态
  active = true;
  
  // 是否是玩家子弹
  readonly isPlayer: boolean;
  
  // 子弹类型
  readonly type: 'normal' | 'tracking' | 'spread' | 'laser';
  
  // 跟踪目标（用于跟踪弹）
  private targetX: number | null = null;
  
  // 构造函数
  constructor(x: number, y: number, speed: number, damage: number, isPlayer: boolean, type: 'normal' | 'tracking' | 'spread' | 'laser' = 'normal', level = 1) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.damage = damage;
    this.isPlayer = isPlayer;
    this.type = type;
    
    // 根据类型和等级设置尺寸
    if (type === 'laser') {
      // 激光：宽度+20%/级
      this.width = 6 * (1 + (level - 1) * 0.2);
      this.height = 40;
    } else if (type === 'spread') {
      // 散弹：基础大小+每级增加
      const baseSize = SPREAD_BULLET_BASE_SIZE[level - 1] || 6;
      this.width = baseSize;
      this.height = baseSize;
    } else if (type === 'tracking') {
      // 追踪：大小+50%/级
      this.width = 5 * (1 + (level - 1) * 0.5);
      this.height = 15 * (1 + (level - 1) * 0.5);
    } else {
      // 普通：1x, 2x, 4x, 7x, 10x
      const sizeMultiplier = NORMAL_BULLET_SIZES[level - 1] || 1;
      this.width = 4 * sizeMultiplier;
      this.height = 12 * sizeMultiplier;
    }
  }
  
  // 设置跟踪目标
  setTarget(x: number): void {
    this.targetX = x;
  }
  
  // 更新
  update(deltaTime: number): void {
    // 垂直移动（所有子弹都向上）
    this.y -= this.speed * deltaTime / 16;
    
    // 横向移动（散弹和跟踪弹）
    if (this.type === 'spread' || this.type === 'tracking') {
      this.x += this.vx * deltaTime / 16;
    }
    
    // 跟踪弹特殊逻辑：追踪目标
    if (this.type === 'tracking' && this.targetX !== null) {
      const dx = this.targetX - this.x;
      this.vx = dx * 0.08; // 追踪强度
    }
  }
  
  // 检查是否超出边界
  isOutOfBounds(canvasHeight: number): boolean {
    return this.y < -this.height || this.y > canvasHeight + this.height;
  }
  
  // 检查碰撞
  checkCollision(rect: Rect): boolean {
    return checkCollision(this.getRect(), rect);
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
  
  // 渲染
  render(ctx: CanvasRenderingContext2D): void {
    if (this.type === 'tracking') {
      // 跟踪弹：青色圆形带尾迹
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
      // 尾迹效果
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y + 5, this.width / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (this.type === 'laser') {
      // 激光：红色发光长方形
      ctx.save();
      ctx.shadowColor = '#e74c3c';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
      );
      ctx.restore();
    } else if (this.type === 'spread') {
      // 散弹：紫色发光圆形
      ctx.save();
      ctx.shadowColor = '#9b59b6';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#9b59b6';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      // 普通子弹：黄色圆形
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * 子弹管理器类
 */
export class BulletManager {
  // 子弹列表
  private bullets: Bullet[] = [];
  
  // 游戏配置
  private config: GameConfig;
  
  // 构造函数
  constructor(config: GameConfig) {
    this.config = config;
  }
  
  // 创建玩家子弹（带等级）
  createPlayerBullet(x: number, y: number, level = 1): void {
    const bullet = new Bullet(
      x,
      y,
      this.config.bulletSpeed,
      this.config.bulletDamage,
      true,
      'normal',
      level  // 传递等级，让构造函数计算大小
    );
    this.bullets.push(bullet);
  }
  
  // 创建敌人子弹
  createEnemyBullet(x: number, y: number): void {
    const bullet = new Bullet(
      x,
      y,
      this.config.bulletSpeed * 0.6,
      1,
      false
    );
    this.bullets.push(bullet);
  }
  
  // 创建跟踪弹（带等级）
  createTrackingBullet(x: number, y: number, level = 1): void {
    // 速度+15%/级
    const speedMultiplier = 1 + (level - 1) * 0.15;
    const bullet = new Bullet(
      x,
      y,
      this.config.bulletSpeed * 0.8 * speedMultiplier,
      this.config.bulletDamage,
      true,
      'tracking',
      level
    );
    this.bullets.push(bullet);
  }
  
  // 创建散弹（带等级）
  createSpreadBullet(x: number, y: number, level = 1): void {
    // 根据等级决定子弹数量
    const count = SPREAD_BULLET_COUNTS[level - 1] || 2;
    
    // 散射角度：从 -30度 到 +30度（弧度制约为 -0.52 到 0.52）
    const spreadAngle = Math.PI / 6; // 30度
    const angleStep = count > 1 ? spreadAngle / (count - 1) : 0;
    const startAngle = -spreadAngle / 2;
    
    for (let i = 0; i < count; i++) {
      // 计算每个子弹的角度
      const angle = count > 1 ? startAngle + angleStep * i : 0;
      
      const bullet = new Bullet(
        x,
        y,
        this.config.bulletSpeed * 0.9, // 散弹速度稍慢
        this.config.bulletDamage,
        true,
        'spread',
        level
      );
      
      // 根据角度计算横向速度分量
      bullet.vx = Math.sin(angle) * bullet.speed;
      this.bullets.push(bullet);
    }
  }
  
  // 创建激光（带等级）
  createLaserBullet(x: number, y: number, level = 1): void {
    // 速度+50%/级
    const speedMultiplier = 1 + (level - 1) * 0.5;
    const bullet = new Bullet(
      x,
      y,
      this.config.bulletSpeed * 1.2 * speedMultiplier,
      this.config.bulletDamage * 2,
      true,
      'laser',
      level
    );
    this.bullets.push(bullet);
  }
  
  // 更新跟踪弹目标
  updateTrackingTargets(enemies: { x: number; active: boolean }[]): void {
    const playerBullets = this.bullets.filter(b => b.isPlayer && b.type === 'tracking' && b.active);
    for (const bullet of playerBullets) {
      let closestEnemy: { x: number } | null = null;
      let closestDist = Infinity;
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dist = Math.abs(enemy.x - bullet.x);
        if (dist < closestDist) {
          closestDist = dist;
          closestEnemy = enemy;
        }
      }
      if (closestEnemy) {
        bullet.setTarget(closestEnemy.x);
      }
    }
  }
  
  // 更新
  update(deltaTime: number): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      
      bullet.update(deltaTime);
      
      // 移除超出边界的子弹
      if (bullet.isOutOfBounds(this.config.canvasHeight)) {
        bullet.active = false;
      }
    }
  }
  
  // 渲染
  render(ctx: CanvasRenderingContext2D): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      bullet.render(ctx);
    }
  }
  
  // 获取玩家子弹
  getPlayerBullets(): Bullet[] {
    return this.bullets.filter(b => b.isPlayer && b.active);
  }
  
  // 获取敌人子弹
  getEnemyBullets(): Bullet[] {
    return this.bullets.filter(b => !b.isPlayer && b.active);
  }
  
  // 清理
  clear(): void {
    this.bullets = [];
  }
}
