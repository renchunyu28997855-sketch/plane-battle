/**
 * 工具函数
 */

import type { Rect, Position } from '../types';

/**
 * 检测两个矩形是否碰撞
 */
export function checkCollision(rect1: Rect, rect2: Rect): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * 从位置和尺寸创建矩形
 */
export function createRect(position: Position, width: number, height: number): Rect {
  return {
    x: position.x,
    y: position.y,
    width,
    height,
  };
}

/**
 * 限制数值在指定范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 生成随机整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 计算两点之间的距离
 */
export function distance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 格式化分数（补零）
 */
export function formatScore(score: number, digits: number = 6): string {
  return score.toString().padStart(digits, '0');
}

/**
 * 简单的矩形绘制函数
 */
export function drawRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

/**
 * 简单的圆形绘制函数
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 绘制三角形（用于飞机）
 */
export function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  direction: 'up' | 'down' = 'up'
): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  
  if (direction === 'up') {
    ctx.moveTo(x, y - height / 2);
    ctx.lineTo(x - width / 2, y + height / 2);
    ctx.lineTo(x + width / 2, y + height / 2);
  } else {
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x - width / 2, y - height / 2);
    ctx.lineTo(x + width / 2, y - height / 2);
  }
  
  ctx.closePath();
  ctx.fill();
}
