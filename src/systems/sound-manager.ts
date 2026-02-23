/**
 * 音效管理器 - 使用 Web Audio API 生成程序化音效
 */

export type SoundType = 'shoot' | 'enemyShoot' | 'explosion' | 'powerUp' | 'hit' | 'gameOver' | 'levelUp';

export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;
  private volume = 0.3;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;
    } catch {
      console.warn('Web Audio API not supported');
    }
  }

  // 确保 AudioContext 已解锁（浏览器自动播放策略）
  async unlock(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  play(type: SoundType): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    this.unlock();

    switch (type) {
      case 'shoot':
        this.playShoot();
        break;
      case 'enemyShoot':
        this.playEnemyShoot();
        break;
      case 'explosion':
        this.playExplosion();
        break;
      case 'powerUp':
        this.playPowerUp();
        break;
      case 'hit':
        this.playHit();
        break;
      case 'gameOver':
        this.playGameOver();
        break;
      case 'levelUp':
        this.playLevelUp();
        break;
    }
  }

  // 玩家射击 - 快速上升的音调
  private playShoot(): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  // 敌人射击 - 较低沉的音调
  private playEnemyShoot(): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  // 爆炸音效 - 噪声 + 低频
  private playExplosion(): void {
    if (!this.audioContext || !this.masterGain) return;

    // 创建噪声
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    // 低通滤波器
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(this.audioContext.currentTime);
    noise.stop(this.audioContext.currentTime + 0.3);
  }

  // 拾取道具音效
  private playPowerUp(): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
    osc1.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1); // E5
    osc1.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2); // G5

    osc2.frequency.setValueAtTime(523 * 1.5, this.audioContext.currentTime); // G5
    osc2.frequency.setValueAtTime(659 * 1.5, this.audioContext.currentTime + 0.1); // B5
    osc2.frequency.setValueAtTime(784 * 1.5, this.audioContext.currentTime + 0.2); // D6

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

    osc1.start(this.audioContext.currentTime);
    osc2.start(this.audioContext.currentTime);
    osc1.stop(this.audioContext.currentTime + 0.4);
    osc2.stop(this.audioContext.currentTime + 0.4);
  }

  // 命中音效 - 短促
  private playHit(): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.05);

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.05);
  }

  // 游戏结束音效
  private playGameOver(): void {
    if (!this.audioContext || !this.masterGain) return;

    const notes = [392, 370, 330, 262]; // G4, F4, E4, C4
    const duration = 0.2;

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = this.audioContext!.currentTime + i * duration;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // 升级音效
  private playLevelUp(): void {
    if (!this.audioContext || !this.masterGain) return;

    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    const duration = 0.15;

    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.type = 'square';
      osc.frequency.value = freq;

      const startTime = this.audioContext!.currentTime + i * duration;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// 全局音效管理器实例
export const soundManager = new SoundManager();
