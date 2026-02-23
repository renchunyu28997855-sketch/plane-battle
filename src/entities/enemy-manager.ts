/**
 * 敌人管理器
 */

import type { GameConfig, LevelConfig, EnemyType } from '../types';
import { randomInt } from '../utils';
import { Enemy } from './enemy';

/**
 * 敌人管理器类
 */
export class EnemyManager {
  // 敌人列表
  private enemies: Enemy[] = [];

  // 游戏配置
  private config: GameConfig;

  // 关卡配置
  private levelConfig: LevelConfig;

  // 构造函数
  constructor(config: GameConfig) {
    this.config = config;
    this.levelConfig = {
      level: 1,
      name: '第一关',
      enemyCount: 20,
      spawnInterval: 1500,
      enemySpeed: 2,
      bossLevel: false,
      levelTime: 60,
    };
  }

  // 设置关卡配置
  setLevelConfig(levelConfig: LevelConfig): void {
    this.levelConfig = levelConfig;
  }

  // 生成敌人
  spawn(canvasWidth: number): void {
    // 根据关卡生成不同类型的敌人
    const enemyType = this.getRandomEnemyType();
    const x = randomInt(50, canvasWidth - 50);
    const y = -50;

    const enemy = new Enemy(x, y, enemyType, this.config, this.levelConfig);
    this.enemies.push(enemy);
  }

  // 随机获取敌人类型
  private getRandomEnemyType(): EnemyType {
    const rand = Math.random();
    const level = this.levelConfig.level;

    // 根据关卡调整敌人类型概率
    if (this.levelConfig.bossLevel && this.enemies.length === 0) {
      // 最后一关第一个敌人是Boss
      return 'boss';
    }

    if (level === 1) {
      // 第一关：主要是普通敌人
      if (rand < 0.8) return 'normal';
      return 'fast';
    } else if (level === 2) {
      // 第二关：普通和快速敌人
      if (rand < 0.5) return 'normal';
      if (rand < 0.8) return 'fast';
      return 'heavy';
    } else {
      // 第三关：混合敌人
      if (rand < 0.4) return 'normal';
      if (rand < 0.7) return 'fast';
      if (rand < 0.85) return 'elite';
      if (rand < 0.93) return 'shielded';
      return 'bomber';
    }
  }

  // 更新
  update(deltaTime: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;

      enemy.update(deltaTime);

      // 移除超出边界的敌人
      if (enemy.isOutOfBounds()) {
        enemy.destroy();
      }
    }

    // 清理非活动敌人
    this.enemies = this.enemies.filter(e => e.active);
  }

  // 渲染
  render(ctx: CanvasRenderingContext2D): void {
    for (const enemy of this.enemies) {
      enemy.render(ctx);
    }
  }

  // 获取敌人列表
  getEnemies(): Enemy[] {
    return this.enemies;
  }

  // 清除所有敌人
  clear(): void {
    this.enemies = [];
  }
}
