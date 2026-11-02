/* ============================================================
   APP.JS - MAIN APPLICATION

   This file connects the buttons, screens and two game modes.
   Read the functions in order to understand the game workflow.
   ============================================================ */
(function () {
  'use strict';
  // A helper for selecting HTML elements by their id.
  const getElement = id => document.getElementById(id);
  const SETTINGS = window.TypeArenaSettings;
  const core = new window.TypeArenaGameLoop();
  const app = { mode: null, difficulty: 'easy', game: null, feedbackTimer: null, flashTimers: new Map() };
  const ROWS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const DIFFICULTY_TEXT = {
    easy: 'Relaxed pace · build confidence',
    medium: 'More targets · faster reactions',
    hard: 'Maximum challenge · test your limits'
  };

  // 1. SCREEN NAVIGATION AND DIFFICULTY ------------------------
  function showScreen(which) {
    for (const name of ['home', 'game', 'results']) getElement(name + 'Screen').hidden = name !== which;
    window.scrollTo(0, 0);
  }

  function chooseDifficulty(value) {
    if (!['easy', 'medium', 'hard'].includes(value)) return;
    app.difficulty = value;
    document.querySelectorAll('.difficulty-option').forEach(btn => {
      const selected = btn.dataset.difficulty === value;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
    getElement('difficultyDescription').textContent = DIFFICULTY_TEXT[value];
  }

  // 2. CLEANUP: PREVENT OLD TIMERS AND ANIMATIONS -------------
  function clearTemporaryUI() {
    clearTimeout(app.feedbackTimer);
    app.feedbackTimer = null;
    for (const timeout of app.flashTimers.values()) clearTimeout(timeout);
    app.flashTimers.clear();
    getElement('feedback').className = 'game-feedback';
    getElement('arena').classList.remove('is-error');
    getElement('magnetTarget').classList.remove('target-correct', 'target-wrong');
    document.querySelectorAll('.keycap').forEach(key => key.classList.remove('is-hit', 'is-miss'));
  }

  function cleanup() {
    core.stop();
    clearTemporaryUI();
    if (app.game) app.game.destroy();
    app.game = null;
  }

  function resetToHome(resetDifficulty = false) {
    cleanup();
    app.mode = null;
    if (resetDifficulty) chooseDifficulty('easy');
    showScreen('home');
  }

  // 3. START EITHER GAME MODE ----------------------------------
  function startMode(mode) {
    if (mode !== 'bubbles' && mode !== 'magnet') return;
    cleanup();
    app.mode = mode;
    const isBubbles = mode === 'bubbles';
    const config = SETTINGS[mode][app.difficulty];
    getElement('bubblesPanel').hidden = !isBubbles;
    getElement('magnetPanel').hidden = isBubbles;
    getElement('gameHeading').textContent = isBubbles ? 'Bubbles' : 'KeyMagnet';
    getElement('gameModeNumber').textContent = isBubbles ? 'MODE 01 / LETTER RECOGNITION' : 'MODE 02 / KEYBOARD PRECISION';
    getElement('gameLevel').textContent = app.difficulty.toUpperCase();
    getElement('arenaLabel').textContent = isBubbles ? 'BUBBLE FIELD' : 'KEYMAGNET TRAINER';
    getElement('arenaTip').textContent = isBubbles ? 'Type a letter to pop its bubble' : 'Type the highlighted target key';
    getElement('gameFootTip').textContent = isBubbles ? 'Match the letters before they float away.' : 'React quickly and focus on the glowing key.';
    getElement('arenaProgressNote').textContent = isBubbles ? 'SPEED LVL 1' : 'ROUND 01';
    getElement('feedback').textContent = 'GET READY';
    renderKeyboard();
    showScreen('game');
    const view = { feedback, refresh: refreshHUD, flashKey, shake, finish: finishMode, updateTarget, animateTarget };
    app.game = isBubbles
      ? new window.TypeArenaBubbles(config, core, view)
      : new window.TypeArenaKeyMagnet(config, core, view);
    core.start((dt, timestamp) => {
      if (app.game) app.game.update(dt, timestamp);
    }, refreshHUD);
    app.game.start();
    refreshHUD();
  }

  // 4. UPDATE THE LIVE SCORE AND STATUS -----------------------
  function refreshHUD() {
    if (!app.game || core.status !== 'playing') return;
    const game = app.game;
    const elapsed = Math.floor(core.elapsed);
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const seconds = String(elapsed % 60).padStart(2, '0');
    getElement('statScore').textContent = String(game.score);
    if (app.mode === 'bubbles') {
      getElement('stat2Label').innerHTML = 'MISSES <span aria-hidden="true">⊗</span>';
      getElement('stat2Value').textContent = `${game.misses} / ${game.config.missLimit}`;
      getElement('stat2Caption').textContent = 'Until game over';
      getElement('stat3Label').innerHTML = 'POPPED <span aria-hidden="true">✓</span>';
      getElement('stat3Value').textContent = String(game.correct);
      getElement('stat3Caption').textContent = `${game.wrong} wrong key${game.wrong === 1 ? '' : 's'}`;
      getElement('stat4Label').innerHTML = 'TIME <span aria-hidden="true">◷</span>';
      getElement('stat4Value').textContent = `${minutes}:${seconds}`;
      getElement('stat4Caption').textContent = 'Session elapsed';
      getElement('arenaProgressNote').textContent = `SPEED LVL ${game.level}`;
      getElement('bubblesSpeedLabel').textContent = `SPEED ${game.speed} PX/S`;
    } else {
      getElement('stat2Label').innerHTML = 'ACCURACY <span aria-hidden="true">◎</span>';
      const attempts = game.correct + game.wrong + game.timeouts;
      getElement('stat2Value').textContent = `${attempts ? Math.round(game.correct / attempts * 100) : 100}%`;
      getElement('stat2Caption').textContent = `${game.wrong} wrong · ${game.timeouts} missed`;
      getElement('stat3Label').innerHTML = 'CORRECT <span aria-hidden="true">✓</span>';
      getElement('stat3Value').textContent = String(game.correct);
      getElement('stat3Caption').textContent = `Best streak: ${game.bestStreak}`;
      getElement('stat4Label').innerHTML = 'TIME <span aria-hidden="true">◷</span>';
      getElement('stat4Value').textContent = `${minutes}:${seconds}`;
      getElement('stat4Caption').textContent = 'Session elapsed';
      getElement('magnetSetLabel').textContent = game.config.setLabel;
      getElement('magnetRoundLabel').textContent = `ROUND ${String(Math.min(game.roundsDone + 1, game.config.totalRounds)).padStart(2, '0')} / ${game.config.totalRounds}`;
      getElement('magnetProgressFill').style.width = `${game.roundsDone / game.config.totalRounds * 100}%`;
      getElement('arenaProgressNote').textContent = `ROUND ${Math.min(game.roundsDone + 1, game.config.totalRounds)} / ${game.config.totalRounds}`;
      if (game.config.secondsPerTarget === null) {
        getElement('magnetTimerCaption').textContent = 'No per-key time limit';
        getElement('magnetTimeRemaining').textContent = '∞';
        getElement('magnetTimeFill').style.width = '100%';
        getElement('magnetTimeFill').classList.remove('is-low');
      } else {
        const remain = Math.max(0, game.timeLeft);
        getElement('magnetTimerCaption').textContent = 'TARGET TIME REMAINING';
        getElement('magnetTimeRemaining').textContent = `${remain.toFixed(1)}s`;
        getElement('magnetTimeFill').style.width = `${remain / game.config.secondsPerTarget * 100}%`;
        getElement('magnetTimeFill').classList.toggle('is-low', remain < 1.25);
      }
    }
  }

  // 5. BUILD THE ON-SCREEN KEYBOARD ---------------------------
  function renderKeyboard() {
    const element = getElement('virtualKeyboard');
    element.replaceChildren();
    const showDigits = app.mode === 'bubbles' ? false : app.difficulty === 'hard';
    const rows = showDigits ? ROWS : ROWS.slice(1);
    const enabled = app.mode === 'magnet' ? SETTINGS.magnet[app.difficulty].letters : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const characters of rows) {
      const row = document.createElement('div');
      row.className = 'keyboard-row';
      for (const key of characters) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'keycap';
        if (!enabled.includes(key)) button.classList.add('is-disabled');
        button.textContent = key;
        button.dataset.key = key;
        button.setAttribute('aria-label', `Type ${key}`);
        button.addEventListener('click', () => inputKey(key));
        row.appendChild(button);
      }
      element.appendChild(row);
    }
  }

  // 6. HIGHLIGHT THE CURRENT TARGET AND SHOW FEEDBACK --------
  function updateTarget(letter) {
    getElement('magnetTarget').classList.remove('target-correct', 'target-wrong');
    getElement('magnetTarget').textContent = letter;
    document.querySelectorAll('.keycap').forEach(key => key.classList.toggle('is-target', key.dataset.key === letter));
  }

  function animateTarget(success) {
    const el = getElement('magnetTarget');
    el.classList.remove('target-correct', 'target-wrong');
    // Force reflow so rapid consecutive mistakes replay the visual state.
    void el.offsetWidth;
    el.classList.add(success ? 'target-correct' : 'target-wrong');
    if (app.flashTimers.has('target')) clearTimeout(app.flashTimers.get('target'));
    app.flashTimers.set('target', setTimeout(() => {
      el.classList.remove('target-correct', 'target-wrong');
      app.flashTimers.delete('target');
    }, 230));
  }

  function flashKey(letter, good) {
    const element = [...document.querySelectorAll('.keycap')].find(b => b.dataset.key === letter);
    if (!element) return;
    element.classList.remove('is-hit', 'is-miss');
    void element.offsetWidth;
    element.classList.add(good ? 'is-hit' : 'is-miss');
    if (app.flashTimers.has(letter)) clearTimeout(app.flashTimers.get(letter));
    app.flashTimers.set(letter, setTimeout(() => {
      element.classList.remove('is-hit', 'is-miss');
      app.flashTimers.delete(letter);
    }, 250));
  }

  function feedback(message, type = 'neutral') {
    const element = getElement('feedback');
    element.textContent = message;
    element.className = `game-feedback ${type === 'neutral' ? '' : `is-${type}`}`;
    clearTimeout(app.feedbackTimer);
    if (type !== 'neutral') {
      app.feedbackTimer = setTimeout(() => {
        element.className = 'game-feedback';
        element.textContent = 'KEEP TYPING!';
      }, 1150);
    }
  }

  function shake() {
    const board = getElement('arena');
    board.classList.remove('is-error');
    void board.offsetWidth;
    board.classList.add('is-error');
  }

  // 7. HANDLE PLAYER INPUT -----------------------------------
  function inputKey(key) {
    if (core.status !== 'playing' || !app.game) return;
    const clean = String(key).toUpperCase();
    if (!/^[A-Z0-9]$/.test(clean)) return;
    app.game.handleKey(clean);
  }

  // 8. SHOW THE RESULTS SCREEN -------------------------------
  function finishMode(reason) {
    if (!app.game || core.status !== 'playing') return;
    // Lock in the elapsed time before showing the results screen.
    core.finish();
    clearTemporaryUI();
    const stats = app.game.results();
    getElement('resultsScore').textContent = String(stats.score);
    getElement('resultsModeLabel').textContent = `${stats.mode === 'bubbles' ? 'BUBBLES' : 'KEYMAGNET'} · ${app.difficulty.toUpperCase()}`;
    const isBubbles = stats.mode === 'bubbles';
    getElement('resultsHeading').textContent = isBubbles ? 'Bubbles cleared!' : 'Challenge complete!';
    getElement('resultsSubtitle').textContent = isBubbles
      ? `You reached the ${stats.missLimit}-miss limit. Every popped bubble counts!`
      : `You finished ${stats.totalRounds} target rounds. Keep practicing for a sharper response time.`;
    const rows = isBubbles
      ? [['BUBBLES POPPED', stats.correct], ['WRONG KEYS', stats.wrong], ['KEY ACCURACY', `${stats.accuracy}%`], ['TIME PLAYED', formatSeconds(stats.seconds)], ['MISSES', `${stats.misses} / ${stats.missLimit}`], ['SPEED REACHED', `Level ${stats.level}`]]
      : [['CORRECT HITS', stats.correct], ['WRONG KEYS', stats.wrong], ['KEY ACCURACY', `${stats.accuracy}%`], ['AVG. REACTION', stats.avgResponse === null ? 'N/A' : `${stats.avgResponse.toFixed(2)}s`], ['TIMED OUT', stats.timeouts], ['BEST STREAK', stats.bestStreak]];
    const container = getElement('resultsStats');
    container.replaceChildren();
    for (const [label, value] of rows) {
      const box = document.createElement('div');
      box.className = 'result-stat';
      const caption = document.createElement('span');
      caption.textContent = label;
      const number = document.createElement('strong');
      number.textContent = value;
      box.append(caption, number);
      container.appendChild(box);
    }
    getElement('resultsExplain').textContent = isBubbles
      ? `Scoring: +10 per pop, −${SETTINGS.bubbles[app.difficulty].wrongPenalty} per incorrect key (minimum score 0). Speed rises every 10 pops.`
      : `Scoring: +10 per correct target. Accuracy includes wrong keypresses and timed-out targets. Average reaction time uses correct hits only.`;
    showScreen('results');
  }

  function formatSeconds(seconds) {
    const count = Math.floor(seconds);
    return `${String(Math.floor(count / 60)).padStart(2, '0')}:${String(count % 60).padStart(2, '0')}`;
  }

  // 9. INSTRUCTIONS DIALOG AND BUTTON EVENTS ------------------
  function showRules() {
    const modal = getElement('rulesDialog');
    if (!modal.open) modal.showModal();
  }
  function closeRules() { if (getElement('rulesDialog').open) getElement('rulesDialog').close(); }

  document.querySelectorAll('.difficulty-option').forEach(button => {
    button.addEventListener('click', () => chooseDifficulty(button.dataset.difficulty));
  });
  getElement('startBubbles').addEventListener('click', () => startMode('bubbles'));
  getElement('startKeyMagnet').addEventListener('click', () => startMode('magnet'));
  getElement('restartBtn').addEventListener('click', () => startMode(app.mode));
  getElement('resetBtn').addEventListener('click', () => resetToHome(true));
  getElement('backHome').addEventListener('click', () => resetToHome());
  getElement('brandHome').addEventListener('click', () => resetToHome());
  getElement('playAgainBtn').addEventListener('click', () => startMode(app.mode));
  getElement('resultsHomeBtn').addEventListener('click', () => resetToHome());
  getElement('rulesBtn').addEventListener('click', showRules);
  getElement('closeRules').addEventListener('click', closeRules);
  getElement('gotItBtn').addEventListener('click', closeRules);
  getElement('rulesDialog').addEventListener('click', event => {
    if (event.target === getElement('rulesDialog')) {
      closeRules();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!getElement('rulesDialog').open) { event.preventDefault(); showRules(); }
      return;
    }
    if (getElement('rulesDialog').open || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (!/^[a-zA-Z0-9]$/.test(event.key)) return;
    if (core.status === 'playing') {
      event.preventDefault();
      inputKey(event.key);
    }
  });
  chooseDifficulty('easy');
  showScreen('home');
  // Optional read-only diagnostics used during project testing.
  window.TypeArenaDebug = Object.freeze({
    getState: () => ({ mode: app.mode, difficulty: app.difficulty, status: core.status,
      elapsed: core.elapsed, game: app.game ? app.game.results() : null,
      target: app.mode === 'magnet' && app.game ? app.game.target : null,
      activeBubbles: app.mode === 'bubbles' && app.game ? app.game.bubbles.map(b => b.letter) : [] })
  });
})();
