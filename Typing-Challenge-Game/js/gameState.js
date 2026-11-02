/* ============================================================
   GAMESTATE.JS - Difficulty settings and one shared animation loop.
   All game code uses plain JavaScript (no library required).
   ============================================================ */
(function () {
  'use strict';
  const SETTINGS = Object.freeze({
    bubbles: {
      easy:   { initialBubbles: 5, speed: 40, missLimit: 8, wrongPenalty: 2, label: 'Easy' },
      medium: { initialBubbles: 7, speed: 65, missLimit: 6, wrongPenalty: 3, label: 'Medium' },
      hard:   { initialBubbles: 9, speed: 90, missLimit: 4, wrongPenalty: 5, label: 'Hard' }
    },
    magnet: {
      easy:   { letters: 'ASDFJKL', totalRounds: 15, secondsPerTarget: null, setLabel: 'HOME ROW · A S D F J K L', label: 'Easy' },
      medium: { letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', totalRounds: 25, secondsPerTarget: 5, setLabel: 'FULL ALPHABET · A–Z', label: 'Medium' },
      hard:   { letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', totalRounds: 35, secondsPerTarget: 3, setLabel: 'LETTERS + NUMBERS · A–Z, 0–9', label: 'Hard' }
    }
  });

  class GameLoop {
    constructor() {
      this.status = 'idle';
      this.elapsed = 0;
      this.frameId = null;
      this.lastFrame = 0;
      this.pending = new Set();
      this.runner = null;
      this.tick = null;
      this.frame = this.frame.bind(this);
    }

    start(runner, tick) {
      this.stop();
      this.status = 'playing';
      this.elapsed = 0;
      this.lastFrame = performance.now();
      this.runner = runner;
      this.tick = tick;
      this.frameId = requestAnimationFrame(this.frame);
    }

    frame(timestamp) {
      if (this.status !== 'playing') return;
      const dt = Math.min((timestamp - this.lastFrame) / 1000, 0.08);
      this.lastFrame = timestamp;
      this.elapsed += Math.max(0, dt);
      if (this.runner) this.runner(dt, timestamp);
      if (this.status !== 'playing') return;
      if (this.tick) this.tick();
      this.frameId = requestAnimationFrame(this.frame);
    }

    schedule(fn, milliseconds) {
      const timerId = setTimeout(() => {
        this.pending.delete(timerId);
        if (this.status === 'playing') fn();
      }, milliseconds);
      this.pending.add(timerId);
      return timerId;
    }

    cancelScheduled() {
      for (const id of this.pending) clearTimeout(id);
      this.pending.clear();
    }

    stop() {
      this.status = 'idle';
      if (this.frameId !== null) cancelAnimationFrame(this.frameId);
      this.frameId = null;
      this.cancelScheduled();
      this.runner = null;
      this.tick = null;
    }

    finish() {
      const seconds = this.elapsed;
      this.stop();
      this.status = 'finished';
      this.elapsed = seconds;
    }
  }

  window.TypeArenaSettings = SETTINGS;
  window.TypeArenaGameLoop = GameLoop;
})();
