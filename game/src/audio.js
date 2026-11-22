// All sound is synthesised with WebAudio: short oscillator blips and filtered
// noise, no audio files. The context is created on the first user gesture,
// so the game never plays sound before the player touches it.

export function createAudio() {
  let context = null;
  let muted = false;
  let alarmTimer = 0;

  function ensure() {
    if (context === null) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
      } catch {
        context = null;
      }
    }
    if (context !== null && context.state === 'suspended') context.resume();
    return context;
  }

  function tone(frequency, seconds, type, volume, when) {
    const audio = ensure();
    if (audio === null || muted) return;
    const start = audio.currentTime + (when || 0);
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + seconds + 0.05);
  }

  function noise(seconds, volume) {
    const audio = ensure();
    if (audio === null || muted) return;
    const length = Math.floor(audio.sampleRate * seconds);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    // Deterministic white noise from a fixed-seed xorshift, so the sound
    // is the same every run and nothing here rolls unseeded dice.
    let state = 0x9e3779b9;
    for (let index = 0; index < length; index += 1) {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      data[index] = ((state >>> 0) / 4294967296) * 2 - 1;
    }
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start();
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.12);
      tone(1318, 0.16, 'sine', 0.1, 0.06);
    },
    emerald() {
      tone(523, 0.14, 'triangle', 0.14);
      tone(659, 0.14, 'triangle', 0.14, 0.09);
      tone(784, 0.2, 'triangle', 0.14, 0.18);
      tone(1046, 0.3, 'sine', 0.12, 0.27);
    },
    coin() {
      tone(1568, 0.1, 'square', 0.06);
      tone(2093, 0.14, 'square', 0.05, 0.07);
    },
    smoke() {
      noise(0.5, 0.12);
    },
    spotted() {
      tone(220, 0.18, 'sawtooth', 0.1);
      tone(220, 0.18, 'sawtooth', 0.1, 0.2);
    },
    caught() {
      tone(392, 0.25, 'sawtooth', 0.12);
      tone(311, 0.25, 'sawtooth', 0.12, 0.2);
      tone(233, 0.5, 'sawtooth', 0.12, 0.4);
    },
    levelDone() {
      tone(659, 0.14, 'triangle', 0.12);
      tone(880, 0.14, 'triangle', 0.12, 0.1);
      tone(1046, 0.3, 'triangle', 0.12, 0.2);
    },
    win() {
      const notes = [523, 659, 784, 1046, 784, 1046, 1318];
      for (let index = 0; index < notes.length; index += 1) tone(notes[index], 0.22, 'triangle', 0.12, index * 0.11);
    },
    /** A soft beep while the alarm runs hot; call every frame with dt. */
    alarmBeep(alarm, dt) {
      if (alarm < 70) return;
      alarmTimer -= dt;
      if (alarmTimer <= 0) {
        alarmTimer = alarm > 90 ? 0.35 : 0.7;
        tone(980, 0.09, 'square', 0.05);
      }
    },
  };
}
