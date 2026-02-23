/**
 * 游戏入口文件
 */

import { GameEngine } from './engine/game-engine';

// 获取 Canvas 元素
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

if (!canvas) {
  throw new Error('找不到游戏 Canvas 元素');
}

// 创建游戏引擎
const game = new GameEngine(canvas);

// 导出游戏实例供调试使用
export { game };

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  game.destroy();
});
