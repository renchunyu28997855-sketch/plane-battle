# AGENTS.md - 项目开发指南

本文档为 AI 代理和开发人员提供项目开发规范和命令参考。

---

## 1. 项目概述

- **项目名称**: 飞机大战 (Plane Battle Game)
- **项目类型**: Web 游戏
 **技术栈**: HTML5 Canvas + TypeScript
 **当前状态**: 全新项目，初始化阶段
 **游戏设计**: 经典飞机大战，3个关卡

---

## 2. 开发命令

### 2.1 通用命令

```bash
# 安装依赖
npm install
# 或
yarn install

# 开发模式 (启动开发服务器)
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 2.2 测试命令

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm test -- --watch

# 运行单个测试文件
npm test -- <test-file-name>

# 生成测试覆盖率报告
npm test -- --coverage
```

### 2.3 代码质量

```bash
# 代码检查
npm run lint

# 自动修复 lint 问题
npm run lint -- --fix

# 代码格式化
npm run format

# 类型检查
npm run typecheck
```

---

## 3. 代码风格规范

### 3.1 通用规范

- **语言**: 中文注释，英文代码
- **缩进**: 2 空格 (或根据项目 .editorconfig)
- **行尾**: LF (Unix-style)
- **文件编码**: UTF-8

### 3.2 命名约定

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 文件/目录 | 短横线命名 (kebab-case) | `plane-game.ts`, `game-utils` |
| 类名 | 帕斯卡命名 (PascalCase) | `Plane`, `BulletManager` |
| 函数/变量 | 驼峰命名 (camelCase) | `movePlane`, `isGameOver` |
| 常量 | 全大写下划线 | `MAX_BULLETS`, `GAME_SPEED` |
| 接口/类型 | 帕斯卡命名 + 前缀 | `IBullet`, `TGameState` |

### 3.3 导入规范

```typescript
// 优先顺序：外部库 → 内部模块 → 相对导入
import React from 'react';
import { GameEngine } from './engine';
import { Bullet } from '../entities/bullet';

// 避免使用 *
import { Plane, Bullet, Enemy } from './entities';

// 类型导入使用 import type
import type { GameState, Position } from './types';
```

### 3.4 函数规范

```typescript
// 使用箭头函数或函数声明，保持简洁
const movePlane = (x: number, y: number): void => {
  // ...
};

function calculateScore(hits: number, time: number): number {
  return hits * 100 - time * 10;
}

// 尽量使用默认参数而非 || 短路
function initGame(level: number = 1, speed: number = 1): void {
  // ...
}
```

### 3.5 错误处理

```typescript
// 使用 try-catch 并提供有意义的错误信息
try {
  await loadGameAssets();
} catch (error) {
  console.error('资源加载失败:', error);
  showErrorDialog('游戏资源加载失败，请刷新页面');
}

// 自定义错误类
class GameError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GameError';
  }
}
```

---

## 4. 目录结构规范

```
src/
├── assets/          # 静态资源 (图片、音频)
├── components/      # UI 组件
├── entities/       # 游戏实体 (飞机、子弹、敌人)
├── engine/         # 游戏引擎核心
├── hooks/          # 自定义 Hooks
├── utils/          # 工具函数
├── types/          # 类型定义
└── index.ts        # 入口文件
```

---

## 5. Git 提交规范

### 5.1 提交信息格式

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

### 5.2 类型前缀

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式调整 |
| refactor | 重构 |
| test | 测试相关 |
| chore | 构建/工具变动 |

### 5.3 示例

```
feat(plane): 添加玩家飞机移动控制

- 支持键盘方向键移动
- 添加触摸滑动支持
- 修复移动边界检测问题

Closes #12
```

---

## 6. 注意事项

### 6.1 代理行为规范

- **禁止** 使用 `as any` 或 `@ts-ignore` 绕过类型检查
- **禁止** 提交 secrets (API keys, tokens) 到版本控制
- **禁止** 删除或修改现有测试来让测试通过
- **必须** 在提交前运行 `npm run lint` 和 `npm test`
- **必须** 确保 TypeScript 类型检查无错误

### 6.2 遇到问题时的处理

1. 首先尝试自行解决 (不超过 3 次尝试)
2. 如果问题复杂，咨询 Oracle (架构/调试专家)
3. 如果需要非传统方案，咨询 Artistry
4. 不要在未充分理解问题的情况下盲目修改代码

---

## 7. 待填充内容

当确定技术栈后，请更新以下内容：

- [ ] 具体的 package.json scripts
- [ ] 测试框架配置 (Jest / Vitest / Playwright)
- [ ] Linter 配置 (ESLint 规则)
- [ ] 格式化工具配置 (Prettier)
- [ ] TypeScript 编译选项
- [ ] 具体的目录结构

---

*本文档由 Sisyphus AI Agent 生成，最后更新于 2026-02-23*
