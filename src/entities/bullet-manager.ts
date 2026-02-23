/**
 * 子弹管理器
 */

import type { GameConfig, Rect } from '../types';
import { checkCollision } from '../utils';

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
  constructor(x: number, y: number, speed: number, damage: number, isPlayer: boolean, type: 'normal' | 'tracking' | 'spread' | 'laser' = 'normal') {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.damage = damage;
    this.isPlayer = isPlayer;
    this.type = type;
    
    // 根据类型设置尺寸
    if (type === 'laser') {
      this.width = 6;
      this.height = 40;
    } else if (type === 'spread') {
      this.width = 4;
      this.height = 10;
    } else {
      this.width = 4;
      this.height = 12;
    }
  }
  
  // 设置跟踪目标
  setTarget(x: number): void {
    this.targetX = x;
  }
  
  // 更新位置
  update(deltaTime: number): void {
    const direction = this.isPlayer ? -1 : 1;
    const timeScale = deltaTime / 16;
    
    if (this.type === 'tracking' && this.targetX !== null) {
      // 跟踪弹：向目标方向轻微转向
      const dx = this.targetX - this.x;
      this.vx = dx * 0.02; // 跟踪强度
      this.y += this.speed * direction * timeScale;
      this.x += this.vx * timeScale;
    } else if (this.type === 'spread') {
      // 散弹：有横向速度
      this.y += this.speed * direction * timeScale;
      this.x += this.vx * timeScale;
    } else if (this.type === 'laser') {
      // 激光：快速移动
      this.y += this.speed * 1.5 * direction * timeScale;
    } else {
      // 普通子弹
      this.y += this.speed * direction * timeScale;
    }
  }
  
  // 是否超出边界
  isOutOfBounds(canvasHeight: number): boolean {
    return this.y < -this.height || this.y > canvasHeight + this.height;
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
    
    if (this.type === 'laser') {
      // 激光效果
      const gradient = ctx.createLinearGradient(this.x, this.y - this.height / 2, this.x, this.y + this.height / 2);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(0, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      
      // 发光效果
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffff';
      ctx.fillRect(this.x - 2, this.y - this.height / 2, 4, this.height);
      ctx.shadowBlur = 0;
    } else if (this.type === 'tracking') {
      // 跟踪弹：蓝色
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
      ctx.fill();
      
      // 拖尾效果
      ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.fillRect(this.x - 1, this.y + this.height / 2, 2, 8);
    } else if (this.type === 'spread') {
      // 散弹：紫色
      ctx.fillStyle = '#9b59b6';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width + 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 普通子弹
      ctx.fillStyle = this.isPlayer ? '#f1c40f' : '#e74c3c';
      ctx.fillRect(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
      );
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
  
  // 创建玩家子弹
  createPlayerBullet(x: number, y: number): void {
    const bullet = new Bullet(
      x,
      y,
      this.config.bulletSpeed,
      this.config.bulletDamage,
      true
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
    this.bullets.push(bullet);
  }
  
  // 创建跟踪弹
  createTrackingBullet(x: number, y: number, targetX: number): void {
    const bullet = new Bullet(
      x,
      y,
      this.config.bulletSpeed * 0.8,
      this.config.bulletDamage,
      true,
      'tracking'
    );
    bullet.setTarget(targetX);
    this.bullets.push(bullet);
  }
  
  // 创建散弹（3发）
  createSpreadBullet(x: number, y: number): void {
    const angles = [-0.3, 0, 0.3]; // 散射角度
    for (const angle of angles) {
      const bullet = new Bullet(
        x,
        y,
        this.config.bulletSpeed * 0.9,
        this.config.bulletDamage,
        true,
        'spread'
      );
      bullet.vx = Math.sin(angle) * bullet.speed;
      this.bullets.push(bullet);
    }
  }
  
  // 创建激光
  createLaserBullet(x: number, y: number): void {
    const bullet = new Bullet(
      x,
      y,
      this.config.bulletSpeed * 1.2,
      this.config.bulletDamage * 2,
      true,
      'laser'
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
    
    // 清理非活动子弹
    this.bullets = this.bullets.filter(b => b.active);
  }
  
  // 渲染
  render(ctx: CanvasRenderingContext2D): void {
    for (const bullet of this.bullets) {
      bullet.render(ctx);
    }
  }
  
  // 获取玩家子弹
  getPlayerBullets(): Bullet[] {
    return this.bullets.filter(b => b.isPlayer);
  }
  
  // 获取敌人子弹
  getEnemyBullets(): Bullet[] {
    return this.bullets.filter(b => !b.isPlayer);
  }
  
  // 清除所有子弹
  clear(): void {
    this.bullets = [];
  }
}
