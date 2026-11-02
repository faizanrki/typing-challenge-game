/* ============================================================
   BUBBLES.JS - MODE A: Floating letters, scoring, speed and misses.
   All game code uses plain JavaScript (no library required).
   ============================================================ */
(function () {
  'use strict';
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const COLORS = ['bubble-cyan', 'bubble-blue', 'bubble-violet', 'bubble-yellow', 'bubble-rose'];
  const choose = array => array[Math.floor(Math.random() * array.length)];

  class BubblesGame {
    constructor(config, core, view) {
      this.config = config;
      this.core = core;
      this.view = view;
      this.field = document.getElementById('bubbleField');
      this.layer = document.getElementById('bubbleLayer');
      this.popLayer = document.getElementById('popLayer');
      this.bubbles = [];
      this.nextId = 1;
      this.score = 0;
      this.correct = 0;
      this.wrong = 0;
      this.misses = 0;
      this.level = 1;
      this.activeCount = config.initialBubbles;
    }

    start() {
      this.destroy();
      this.score = 0;
      this.correct = 0;
      this.wrong = 0;
      this.misses = 0;
      this.level = 1;
      this.activeCount = this.config.initialBubbles;
      this.nextId = 1;
      // All initial bubbles are wholly visible inside the field on the very first frame.
      for (let i = 0; i < this.activeCount; i++) this.spawn(i, this.activeCount);
      this.view.feedback('TYPE A LETTER TO POP ITS BUBBLE', 'neutral');
      this.view.refresh();
    }

    get speed() {
      return Math.round(Math.min(this.config.speed * Math.pow(1.13, this.level - 1), this.config.speed * 2.5));
    }

    get bubbleSize() {
      const width = this.field.clientWidth || 400;
      return width < 350 ? 46 : width < 550 ? 51 : 58;
    }

    spawn(initialIndex = null, initialCount = null) {
      const size = this.bubbleSize;
      const width = Math.max(this.field.clientWidth, 260);
      const height = Math.max(this.field.clientHeight, 280);
      const lanes = Math.max(3, Math.floor((width - 16) / (size + 11)));
      let lane = 0;
      if (initialIndex !== null) {
        lane = (initialIndex * 3 + 1) % lanes;
      } else {
        // Choose a free space near the bottom instead of stacking new bubbles.
        let highestClearance = -Infinity;
        for (let n = 0; n < lanes; n++) {
          const x = 8 + (n + 0.5) * (width - 16) / lanes - size / 2;
          const nearby = this.bubbles.filter(b => Math.abs(b.x - x) < size * 1.1);
          const nearestBottomDistance = nearby.length ? Math.min(...nearby.map(b => Math.abs(b.y - (height - size - 8)))) : height;
          if (nearestBottomDistance > highestClearance) { highestClearance = nearestBottomDistance; lane = n; }
        }
      }
      const x = Math.max(4, Math.min(width - size - 4, 8 + (lane + 0.5) * (width - 16) / lanes - size / 2));
      const y = initialIndex !== null
        ? Math.max(10, height * (0.23 + initialIndex * 0.64 / Math.max(1, initialCount - 1)) - size / 2)
        : height - size - 7;
      const letter = choose(LETTERS);
      const element = document.createElement('div');
      element.className = `game-bubble ${choose(COLORS)}`;
      element.textContent = letter;
      element.style.width = `${size}px`;
      element.style.height = `${size}px`;
      element.style.transform = `translate3d(${x}px,${y}px,0)`;
      element.setAttribute('aria-hidden', 'true');
      this.layer.appendChild(element);
      this.bubbles.push({ id: this.nextId++, letter, x, y, size, element, speedFactor: 0.9 + Math.random() * 0.2 });
    }

    update(dt) {
      for (let index = this.bubbles.length - 1; index >= 0; index--) {
        const bubble = this.bubbles[index];
        bubble.y -= this.speed * bubble.speedFactor * dt;
        if (bubble.y <= 0) {
          this.bubbles.splice(index, 1);
          bubble.element.remove();
          this.misses++;
          this.view.feedback(`MISSED ${bubble.letter}! ${this.config.missLimit - this.misses} MISSES LEFT`, 'wrong');
          if (this.misses >= this.config.missLimit) {
            this.view.refresh();
            this.view.finish('miss-limit');
            return;
          }
          this.spawn();
          this.view.refresh();
        } else {
          bubble.element.style.transform = `translate3d(${bubble.x}px,${bubble.y}px,0)`;
        }
      }
    }

    handleKey(key) {
      if (!/^[A-Z0-9]$/.test(key)) return;
      // If a letter appears more than once, pop the highest bubble (the most urgent one).
      const selected = this.bubbles.filter(b => b.letter === key).sort((a, b) => a.y - b.y)[0];
      if (!selected) {
        this.wrong++;
        this.score = Math.max(0, this.score - this.config.wrongPenalty);
        this.view.feedback(`NO ${key} BUBBLE · −${this.config.wrongPenalty} POINTS`, 'wrong');
        this.view.flashKey(key, false);
        this.view.shake();
      } else {
        this.bubbles = this.bubbles.filter(b => b.id !== selected.id);
        selected.element.remove();
        this.popPoints(selected, '+10');
        this.score += 10;
        this.correct++;
        this.view.flashKey(key, true);
        this.view.feedback(`PERFECT! ${key} POPPED · +10 POINTS`, 'correct');
        if (this.correct % 10 === 0) {
          this.level++;
          if (this.correct % 20 === 0) this.activeCount = Math.min(12, this.activeCount + 1);
          this.view.feedback(`SPEED UP! LEVEL ${this.level} · ${this.speed} PX/S`, 'info');
        }
        // Replace popped bubbles immediately so the field always has the target count.
        while (this.bubbles.length < this.activeCount) this.spawn();
      }
      this.view.refresh();
    }

    popPoints(bubble, label) {
      const element = document.createElement('span');
      element.className = 'pop-points';
      element.textContent = label;
      element.style.left = `${bubble.x + bubble.size / 4}px`;
      element.style.top = `${bubble.y}px`;
      this.popLayer.appendChild(element);
      this.core.schedule(() => element.remove(), 700);
    }

    results() {
      const inputs = this.correct + this.wrong;
      return {
        mode: 'bubbles', score: this.score, correct: this.correct, wrong: this.wrong,
        misses: this.misses, missLimit: this.config.missLimit, level: this.level, speed: this.speed,
        accuracy: inputs ? Math.round(100 * this.correct / inputs) : 0,
        seconds: this.core.elapsed
      };
    }

    destroy() {
      this.bubbles = [];
      this.layer.replaceChildren();
      this.popLayer.replaceChildren();
    }
  }
  window.TypeArenaBubbles = BubblesGame;
})();
