// src/engine/audioEngine.ts

class AudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext() {
    if (!this.ctx) {
      // Create context on first use to comply with browser autoplay policies
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public playSuccess() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Sweet arpeggio: C5 -> E5 -> G5 -> C6
      const now = ctx.currentTime;
      
      osc.frequency.setValueAtTime(523.25, now);       // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3);// C6
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  }

  public playFail() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      
      // Low descending 'boing'
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  }

  public playLevelUp() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Play a little fanfare (C major chord progression)
      [
        { freq: 523.25, type: 'square', start: now, dur: 0.15 },       // C5
        { freq: 659.25, type: 'square', start: now + 0.15, dur: 0.15 },// E5
        { freq: 783.99, type: 'square', start: now + 0.3, dur: 0.15 }, // G5
        { freq: 1046.50, type: 'square', start: now + 0.45, dur: 0.6 } // C6 (held)
      ].forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = note.type as OscillatorType;
        osc.frequency.value = note.freq;
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        gain.gain.setValueAtTime(0, note.start);
        gain.gain.linearRampToValueAtTime(0.15, note.start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, note.start + note.dur);
        
        osc.start(note.start);
        osc.stop(note.start + note.dur);
      });
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  }
}

export const audio = new AudioEngine();
