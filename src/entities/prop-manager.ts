/**
 * 道具管理器
 */

import type { GameConfig } from '../types';
import { randomInt } from '../utils';
import { Prop, type PropType } from './prop';

/**
 * 道具类型数组
 */
const PROP_TYPES: PropType[] = ['shield', 'speed', 'multiShot', 'power', 'score'];

/**
 * 道具管理器类
 */
export class PropManager {
  // 道具列表
  props: Prop[] = [];

  // 游戏配置
  config: GameConfig;

  // 构造函数
  constructor(config: GameConfig) {
    this.config = config;
  }

  // 创建道具
  spawn(x: number, y: number, type: PropType): Prop {
    const prop = new Prop(x, y, type);
    this.props.push(prop);
    return prop;
  }

  // 随机创建道具
  spawnRandom(x: number, y: number): Prop {
    const randomIndex = randomInt(0, PROP_TYPES.length - 1);
    const type = PROP_TYPES[randomIndex];
    return this.spawn(x, y, type);
  }

  // 更新
  update(deltaTime: number): void {
    // 更新所有道具
    for (const prop of this.props) {
      prop.update(deltaTime);
    }

    // 移除超出边界的道具
    this.props = this.props.filter(
      (prop) => prop.active && !prop.isOutOfBounds(this.config.canvasHeight)
    );
  }

  // 渲染
  render(ctx: CanvasRenderingContext2D): void {
    for (const prop of this.props) {
      prop.render(ctx);
    }
  }

  // 获取所有道具
  getProps(): Prop[] {
    return this.props;
  }

  // 清除所有道具
  clear(): void {
    this.props = [];
  }
}
