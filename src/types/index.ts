/**
 * 基础类型定义
 */

// 位置坐标
export interface Position {
  x: number;
  y: number;
}

// 尺寸
export interface Size {
  width: number;
  height: number;
}

// 矩形区域（用于碰撞检测）
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 游戏状态
export type GameState = 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver';

// 实体类型
export type EntityType = 'player' | 'bullet' | 'enemy' | 'enemyBullet';

// 敌人类型
export type EnemyType = 'normal' | 'fast' | 'heavy' | 'boss' | 'elite' | 'shielded' | 'bomber';

// 子弹类型
export type BulletType = 'normal' | 'tracking' | 'spread' | 'laser';

// 方向
export type Direction = 'up' | 'down' | 'left' | 'right';

// 按键状态
export interface KeyState {
  ArrowUp: boolean;
  ArrowDown: boolean;
  ArrowLeft: boolean;
  ArrowRight: boolean;
  Space: boolean;
}

// 游戏配置
export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  fps: number;
  playerSpeed: number;
  bulletSpeed: number;
  enemyBaseSpeed: number;
  spawnInterval: number;
  bulletDamage: number;
  playerHealth: number;
}

// 关卡配置
export interface LevelConfig {
  level: number;
  name: string;
  enemyCount: number;
  spawnInterval: number;
  enemySpeed: number;
  bossLevel: boolean;
}

// 默认游戏配置
export const DEFAULT_GAME_CONFIG: GameConfig = {
  canvasWidth: 480,
  canvasHeight: 720,
  fps: 60,
  playerSpeed: 5,
  bulletSpeed: 8,
  enemyBaseSpeed: 2,
  spawnInterval: 1500,
  bulletDamage: 1,
  playerHealth: 3,
};

// 关卡配置
export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    name: '第一关',
    enemyCount: 35,
    spawnInterval: 1200,
    enemySpeed: 1.5,
    bossLevel: false,
  },
  {
    level: 2,
    name: '第二关',
    enemyCount: 50,
    spawnInterval: 1000,
    enemySpeed: 2,
    bossLevel: false,
  },
  {
    level: 3,
    name: '第三关',
    enemyCount: 60,
    spawnInterval: 800,
    enemySpeed: 2.5,
    bossLevel: true,
  },
];
