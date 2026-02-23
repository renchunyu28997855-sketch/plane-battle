/**
 * 粒子系统 - 核心模块
 * 提供高性能的粒子效果系统，支持对象池优化
 */

// 粒子类型枚举
export enum ParticleType {
  EXPLOSION = "explosion",
  BACKGROUND_STARS = "backgroundStars",
  BULLET_TRAIL = "bulletTrail",
  PLAYER_ENGINE = "playerEngine",
  ENEMY_DEATH = "enemyDeath",
  POWERUP = "powerup",
}

// 粒子生命周期阶段
export enum ParticleLifecycle {
  SPAWNING = "spawning",
  ALIVE = "alive",
  FADING = "fading",
  DEAD = "dead",
}

// 粒子接口
export interface Particle {
  // 位置和速度
  x: number;
  y: number;
  vx: number;
  vy: number;

  // 尺寸和透明度
  size: number;
  alpha: number;

  // 颜色
  color: string;

  // 生命周期
  type: ParticleType;
  lifecycle: ParticleLifecycle;
  life: number;
  maxLife: number;

  // 旋转
  rotation: number;
  rotationSpeed: number;

  // 激活状态
  active: boolean;
}

// 粒子配置接口
export interface ParticleConfig {
  // 粒子数量
  count?: number;

  // 生命周期（毫秒）
  life?: number;

  // 速度范围
  minSpeed?: number;
  maxSpeed?: number;

  // 尺寸范围
  minSize?: number;
  maxSize?: number;

  // 颜色调色板
  colors?: string[];

  // 旋转速度
  rotationSpeed?: number;

  // 渐变模式
  useGradient?: boolean;

  // 是否使用物理
  usePhysics?: boolean;
}

// 粒子系统类
export class ParticleSystem {
  // 粒子列表
  private particles: Particle[] = [];

  // 对象池
  private particlePool: Particle[] = [];

  // 对象池最大容量
  private readonly poolSize = 1000;

  // 配置
  private config: ParticleConfig = {};

  // 构造函数
  constructor(config?: ParticleConfig) {
    this.config = { ...this.getDefaultConfig(), ...config };
    this.initPool();
  }

  // 获取默认配置
  private getDefaultConfig(): ParticleConfig {
    return {
      count: 20,
      life: 1000,
      minSpeed: 1,
      maxSpeed: 5,
      minSize: 2,
      maxSize: 8,
      colors: ["#ff6b6b", "#feca57", "#ff9ff3", "#54a0ff", "#5f27cd"],
      rotationSpeed: 0.1,
      useGradient: true,
      usePhysics: true,
    };
  }

  // 初始化对象池
  private initPool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.particlePool.push(this.createParticle());
    }
  }

  // 创建粒子对象
  private createParticle(): Particle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1,
      alpha: 1,
      color: "#ffffff",
      type: ParticleType.EXPLOSION,
      lifecycle: ParticleLifecycle.DEAD,
      life: 0,
      maxLife: 0,
      rotation: 0,
      rotationSpeed: 0,
      active: false,
    };
  }

  // 从对象池获取粒子
  private getParticle(): Particle | null {
    for (const particle of this.particlePool) {
      if (!particle.active) {
        return particle;
      }
    }

    // 池已满，创建新粒子
    const newParticle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 1,
      alpha: 1,
      color: "#ffffff",
      type: ParticleType.EXPLOSION,
      lifecycle: ParticleLifecycle.DEAD,
      life: 0,
      maxLife: 0,
      rotation: 0,
      rotationSpeed: 0,
      active: false,
    };

    this.particlePool.push(newParticle);
    return newParticle;
  }

  // 释放粒子到对象池
  private releaseParticle(particle: Particle): void {
    particle.active = false;
    particle.lifecycle = ParticleLifecycle.DEAD;
  }

  // 创建爆炸粒子
  createExplosion(
    x: number,
    y: number,
    config?: Partial<ParticleConfig>,
  ): void {
    const particleCount = config?.count ?? this.config.count ?? 20;

    for (let i = 0; i < particleCount; i++) {
      const particle = this.getParticle();
      if (!particle) continue;

      this.initParticle(
        particle,
        x,
        y,
        ParticleType.EXPLOSION,
        config ?? this.config,
      );
    }
  }

  // 创建背景星星粒子
  createBackgroundStars(
    count: number,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) continue;

      this.initParticle(
        particle,
        Math.random() * canvasWidth,
        Math.random() * canvasHeight,
        ParticleType.BACKGROUND_STARS,
        {
          ...this.config,
          minSpeed: 0.1,
          maxSpeed: 0.5,
          life: 2000,
          rotationSpeed: 0,
          usePhysics: false,
        },
      );
    }
  }

  // 创建子弹拖尾粒子
  createBulletTrail(x: number, y: number, isPlayerBullet: boolean): void {
    const particle = this.getParticle();
    if (!particle) return;

    this.initParticle(particle, x, y, ParticleType.BULLET_TRAIL, {
      ...this.config,
      minSpeed: 0,
      maxSpeed: 2,
      life: 200,
      colors: isPlayerBullet ? ["#f1c40f", "#f39c12"] : ["#e74c3c", "#c0392b"],
      usePhysics: true,
    });
  }

  // 创建玩家引擎粒子
  createPlayerEngine(x: number, y: number, _direction: number): void {
    const particle = this.getParticle();
    if (!particle) return;

    this.initParticle(particle, x, y, ParticleType.PLAYER_ENGINE, {
      ...this.config,
      minSpeed: 3,
      maxSpeed: 6,
      life: 300,
      colors: ["#e74c3c", "#f39c12"],
      rotationSpeed: 0.2,
      usePhysics: true,
    });
  }

  // 创建敌人死亡粒子
  createEnemyDeath(x: number, y: number, enemyType: string): void {
    const particleCount = enemyType === "boss" ? 50 : 15;
    const colors =
      enemyType === "boss"
        ? ["#c0392b", "#e74c3c", "#f39c12"]
        : ["#e74c3c", "#9b59b6"];

    for (let i = 0; i < particleCount; i++) {
      const particle = this.getParticle();
      if (!particle) continue;

      this.initParticle(particle, x, y, ParticleType.ENEMY_DEATH, {
        ...this.config,
        minSpeed: 2,
        maxSpeed: 8,
        life: enemyType === "boss" ? 1000 : 500,
        colors: colors,
        rotationSpeed: 0.3,
        usePhysics: true,
      });
    }
  }

  // 初始化粒子
  private initParticle(
    particle: Particle,
    x: number,
    y: number,
    type: ParticleType,
    config: ParticleConfig,
  ): void {
    particle.x = x;
    particle.y = y;
    particle.type = type;
    particle.lifecycle = ParticleLifecycle.ALIVE;
    particle.life = config.life ?? this.config.life ?? 1000;
    particle.maxLife = particle.life;
    particle.rotation = Math.random() * Math.PI * 2;
    particle.rotationSpeed =
      (Math.random() - 0.5) *
      (config.rotationSpeed ?? this.config.rotationSpeed ?? 0.1);

    // 速度
    if (config.usePhysics) {
      const speed =
        Math.random() * (config.maxSpeed ?? this.config.maxSpeed ?? 5) +
        (config.minSpeed ?? this.config.minSpeed ?? 1);
      const angle = Math.random() * Math.PI * 2;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
    } else {
      particle.vx = 0;
      particle.vy = 0;
    }

    // 尺寸
    particle.size =
      Math.random() * (config.maxSize ?? this.config.maxSize ?? 8) +
      (config.minSize ?? this.config.minSize ?? 2);

    // 颜色
    particle.color = (config.colors ?? this.config.colors ?? ["#ffffff"])[
      Math.floor(
        Math.random() *
          ((config.colors ?? this.config.colors ?? ["#ffffff"]).length - 1),
      )
    ];
    particle.alpha = 1;
    particle.active = true;
  }

  // 更新粒子系统
  update(deltaTime: number): void {
    // 更新所有活跃粒子
    for (const particle of this.particles) {
      if (!particle.active) continue;

      // 更新生命周期
      particle.life -= deltaTime;
      if (particle.life <= 0) {
        particle.alpha -= deltaTime / particle.maxLife;
      }

      // 更新物理
      if (
        particle.lifecycle === ParticleLifecycle.ALIVE &&
        (this.config.usePhysics ?? true)
      ) {
        particle.x += particle.vx * (deltaTime / 16);
        particle.y += particle.vy * (deltaTime / 16);
      }

      // 更新旋转
      particle.rotation += particle.rotationSpeed * (deltaTime / 16);

      // 检查是否死亡
      if (particle.alpha <= 0) {
        particle.active = false;
        this.releaseParticle(particle);
      }
    }

    // 清理非活跃粒子
    this.particles = this.particles.filter((p) => p.active);

    // 如果池中有可用的粒子，将其加入活跃列表
    for (const particle of this.particlePool) {
      if (particle.active && !this.particles.includes(particle)) {
        this.particles.push(particle);
      }
    }
  }

  // 渲染粒子
  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      if (!particle.active) continue;

      ctx.save();

      // 移动到粒子位置
      ctx.translate(particle.x, particle.y);

      // 旋转
      ctx.rotate(particle.rotation);

      // 设置透明度
      ctx.globalAlpha = Math.max(0, particle.alpha);

      // 设置颜色
      ctx.fillStyle = particle.color;

      // 绘制
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // 渐变效果
      if (this.config.useGradient) {
        const gradient = ctx.createRadialGradient(
          0,
          0,
          0,
          0,
          0,
          particle.size * 1.5,
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // 获取粒子数量
  getParticleCount(): number {
    return this.particles.length;
  }

  // 清除所有粒子
  clear(): void {
    for (const particle of this.particles) {
      this.releaseParticle(particle);
    }
    this.particles = [];
  }

  // 获取对象池大小
  getPoolSize(): number {
    return this.particlePool.length;
  }
}

// 默认粒子系统实例
let defaultParticleSystem: ParticleSystem | null = null;

// 获取默认粒子系统实例
export function getDefaultParticleSystem(
  config?: ParticleConfig,
): ParticleSystem {
  if (!defaultParticleSystem) {
    defaultParticleSystem = new ParticleSystem(config);
  }
  return defaultParticleSystem;
}

// 重置默认粒子系统
export function resetParticleSystem(): void {
  if (defaultParticleSystem) {
    defaultParticleSystem.clear();
  }
}
