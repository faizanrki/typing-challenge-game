/* ============================================================
   KEYMAGNET.JS - MODE B: Key practice, response time and rounds.
   All game code uses plain JavaScript (no library required).
   ============================================================ */
(function () {
  'use strict';

  class KeyMagnetGame {
    constructor(config, core, view) {
      this.config = config;
      this.core = core;
      this.view = view;
      this.targets = [...config.letters]; // Required JavaScript practice set/target array.
      this.score = 0;
      this.correct = 0;
      this.wrong = 0;
      this.timeouts = 0;
      this.roundsDone = 0;
      this.reactionTotal = 0;
      this.bestStreak = 0;
      this.streak = 0;
      this.target = null;
      this.lastTarget = null;
      this.targetStart = 0;
      this.timeLeft = config.secondsPerTarget;
      this.transitioning = false;
    }

    start() {
      this.score = 0;
      this.correct = 0;
      this.wrong = 0;
      this.timeouts = 0;
      this.roundsDone = 0;
      this.reactionTotal = 0;
      this.bestStreak = 0;
      this.streak = 0;
      this.lastTarget = null;
      this.transitioning = false;
      this.nextTarget();
      this.view.refresh();
    }

    nextTarget() {
      if (this.roundsDone >= this.config.totalRounds) {
        this.view.finish('completed');
        return;
      }
      const choices = this.targets.filter(key => key !== this.lastTarget);
      this.target = choices[Math.floor(Math.random() * choices.length)];
      this.lastTarget = this.target;
      this.targetStart = performance.now();
      this.timeLeft = this.config.secondsPerTarget;
      this.transitioning = false;
      this.view.updateTarget(this.target, this.roundsDone + 1, this.config.totalRounds);
      this.view.refresh();
    }

    update(dt, timestamp) {
      if (this.transitioning || this.config.secondsPerTarget === null) return;
      this.timeLeft = Math.max(0, this.config.secondsPerTarget - (timestamp - this.targetStart) / 1000);
      if (this.timeLeft <= 0) {
        this.roundsDone++;
        this.timeouts++;
        this.streak = 0;
        this.transitioning = true;
        this.view.flashKey(this.target, false);
        this.view.feedback(`TIME'S UP! THE KEY WAS ${this.target}`, 'wrong');
        this.view.refresh();
        this.core.schedule(() => this.nextTarget(), 380);
      }
    }

    handleKey(key) {
      if (this.transitioning || !/^[A-Z0-9]$/.test(key)) return;
      if (key === this.target) {
        this.correct++;
        this.roundsDone++;
        this.score += 10;
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        this.reactionTotal += performance.now() - this.targetStart;
        this.transitioning = true;
        this.view.flashKey(key, true);
        this.view.animateTarget(true);
        this.view.feedback(`NICE HIT! ${key} · +10 POINTS`, 'correct');
        this.core.schedule(() => this.nextTarget(), 230);
      } else {
        this.wrong++;
        this.streak = 0;
        this.view.flashKey(key, false);
        this.view.animateTarget(false);
        this.view.feedback(`WRONG KEY: ${key} · TRY ${this.target}`, 'wrong');
        this.view.shake();
      }
      this.view.refresh();
    }

    results() {
      const attempts = this.correct + this.wrong + this.timeouts;
      return {
        mode: 'magnet', score: this.score, correct: this.correct, wrong: this.wrong,
        timeouts: this.timeouts, rounds: this.roundsDone, totalRounds: this.config.totalRounds,
        bestStreak: this.bestStreak,
        accuracy: attempts ? Math.round(100 * this.correct / attempts) : 0,
        avgResponse: this.correct ? this.reactionTotal / this.correct / 1000 : null,
        seconds: this.core.elapsed
      };
    }

    destroy() {
      this.target = null;
      this.transitioning = true;
    }
  }
  window.TypeArenaKeyMagnet = KeyMagnetGame;
})();
