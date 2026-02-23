/**
 * 道具实体
 */

import type { Rect } from '../types';
import { checkCollision } from '../utils';

/**
 * 道具类型
 */
export type PropType = 'shield' | 'speed' | 'multiShot' | 'power' | 'score';

/**
 * 道具颜色映射
 */
const PROP_COLORS: Record<PropType, string> = {
  shield: '#00ffff',
  speed: '#ffff00',
  multiShot: '#9b59b6',
  power: '#e74c3c',
  score: '#ffd700',
};

/**
 * 道具类
 */
export class Prop {
  // 位置
  x: number;
  y: number;

  // 尺寸
  readonly width = 20;
  readonly height = 20;

  // 类型
  type: PropType;

  // 激活状态
  active = true;

  // 下落速度
  private readonly speed = 2;



  // 构造函数
  constructor(x: number, y: number, type: PropType) {
    this.x = x;
    this.y = y;
    this.type = type;
  }

  // 更新
  update(deltaTime: number): void {
    if (!this.active) return;
    // 向下移动
    this.y += this.speed * (deltaTime / 16);
  }

  // 检查是否超出边界
  isOutOfBounds(canvasHeight: number): boolean {
    return this.y > canvasHeight + this.height;
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

    const color = PROP_COLORS[this.type];

    // 绘制发光效果（仅护盾）
    if (this.type === 'shield') {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      this.drawProp(ctx, color);
      ctx.restore();
    } else {
      this.drawProp(ctx, color);
    }
  }

  // 绘制道具
  private drawProp(ctx: CanvasRenderingContext2D, color: string): void {
    // 绘制背景圆形
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.width / 2
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, this.darkenColor(color, 0.5));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    // 绘制边框
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制道具图标
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = this.getIcon();
    ctx.fillText(icon, this.x, this.y);
  }

  // 获取道具图标
  private getIcon(): string {
    switch (this.type) {
      case 'shield':
        return '🛡';
      case 'speed':
        return '⚡';
      case 'multiShot':
        return '🔱';
      case 'power':
        return '💥';
      case 'score':
        return '⭐';
      default:
        return '?';
    }
  }

  // 颜色变暗辅助函数
  private darkenColor(color: string, factor: number): string {
    // 将 hex 颜色转换为 rgb
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substring(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.substring(2, 4), 16) * factor);
    const b = Math.floor(parseInt(hex.substring(4, 6), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
