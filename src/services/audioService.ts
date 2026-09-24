// Web Audio API sound synthesizer for Mosque RFID attendance kiosk

class SoundEffectsService {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Beep khusus saat tap hadir DITERIMA (Crisp, high-pitched double-beep afirmasi)
  playAcceptedBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Beep 1: Nada C6 (1046.5 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1046.5, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      // Beep 2: Nada E6 (1318.5 Hz) - Nada kedua lebih tinggi, menegaskan sukses
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.11);
      gain2.gain.setValueAtTime(0, now + 0.11);
      gain2.gain.linearRampToValueAtTime(0.4, now + 0.125);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.11);
      osc2.stop(now + 0.3);
    } catch {
      // Audio might be blocked if user has not interacted with page yet
    }
  }

  // Beep khusus saat tap TIDAK DITERIMA / GAGAL (Low buzzing double warning)
  playRejectedBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Buzz 1: 180 Hz (Sawtooth)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(180, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Buzz 2: 140 Hz (Sawtooth) - Menandakan penolakan/kesalahan
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(140, now + 0.16);
      gain2.gain.setValueAtTime(0.35, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.38);
    } catch {
      // Audio might be blocked
    }
  }

  // Play pleasant masjid chime when RFID is successfully scanned
  playSuccessChime() {
    this.playAcceptedBeep();
  }

  // Play cheerful arpeggio for high scores / streak milestones
  playCelebration() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const time = now + idx * 0.09;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(time);
        osc.stop(time + 0.45);
      });
    } catch {
      // fallback
    }
  }

  // Play alert sound when an unknown RFID card is scanned or tap is rejected
  playCardNotFound() {
    this.playRejectedBeep();
  }
}

export const soundEffects = new SoundEffectsService();
