# TYPE ARENA — Typing Challenge Game

**Course:** CSC336 Web Technologies (COMSATS University Islamabad, Vehari Campus)

A responsive, browser-based typing game built for the Lab Mid assignment.
The project uses only HTML5, CSS3 and JavaScript ES6+.

## 1. How to run

1. Extract the ZIP file.
2. Open `Typing-Challenge-Game/index.html` in Chrome, Edge, or Firefox.
3. Choose **Easy**, **Medium**, or **Hard**.
4. Click **Play Bubbles** or **Play KeyMagnet**.

No accounts, databases, software installation or internet access are required.

## 2. Project files

```text
Typing-Challenge-Game/
├── index.html            Home, game, results, and rules screens
├── css/
│   └── style.css         Organized, commented CSS with responsive rules
├── js/
│   ├── gameState.js      Difficulty settings and animation lifecycle
│   ├── bubbles.js        Floating letters, points, and misses
│   ├── keymagnet.js      Targets, timing, and reaction statistics
│   └── app.js            Navigation, UI updates, keyboard input, results
├── demo/
│   └── typing_challenge_demo.mp4
├── previews/
│   ├── desktop_home.png
│   └── mobile_game.png
└── README.md
```

### Beginner code-reading order

1. Open `index.html` to find the page structure and element IDs.
2. Open `css/style.css` to learn how page sections and media queries are styled.
3. Open `js/gameState.js` to see the difficulty values and the single game loop.
4. Read `js/bubbles.js` and `js/keymagnet.js` for each mode's game rules.
5. Read `js/app.js` last: it connects the other files and handles button clicks.

The CSS is deliberately written as separate, indented rules rather than compressed
one-line code. Its numbered comments group related styles (header, home, game,
keyboard, results, dialogs, tablet and phone layouts).

## 3. Bubbles mode

- 5, 7, or 9 bubbles are visible at the start (based on difficulty).
- Letters float upward and pop when a matching key is pressed.
- Correct press: **+10** points. A wrong press subtracts points (not below 0).
- An escaped bubble adds one miss. Reaching the miss limit ends the game.
- The speed increases every **10 popped bubbles**.
- Every **20 pops**, the number of active bubbles increases (up to 12).

| Difficulty | Starting bubbles | Initial speed | Miss limit | Wrong-key penalty |
|-----------|------------------|---------------|------------|-------------------|
| Easy      | 5                | 40 px/s       | 8          | -2                |
| Medium    | 7                | 65 px/s       | 6          | -3                |
| Hard      | 9                | 90 px/s       | 4          | -5                |

## 4. KeyMagnet mode

- A large letter or number appears above a visible keyboard.
- The player must type the highlighted target using a keyboard or on-screen keys.
- Correct key: **+10** points, advances to the next target.
- Wrong key: incorrect count increases; player can retry within the time limit.
- Target timeouts count as missed rounds (Medium and Hard).
- The results show score, accuracy, average response time, streak and timeouts.

| Difficulty | Practice keys | Rounds | Time per target |
|-----------|---------------|--------|-----------------|
| Easy      | A S D F J K L | 15     | Unlimited       |
| Medium    | A to Z        | 25     | 5 seconds       |
| Hard      | A to Z, 0 to 9| 35     | 3 seconds       |

## 5. Controls and lifecycle

- **Start:** Starts the mode selected from the home screen.
- **Restart:** Stops the current game and launches the same mode from the beginning.
- **Reset:** Stops the game, clears the state, resets difficulty to Easy, and goes home.
- **Back to home:** Stops the game and goes home while retaining difficulty.
- **How to play:** Opens the instructions dialog.
- All actions happen without reloading the page.
- One `requestAnimationFrame` loop handles movement and timers.
- Old animation frames and scheduled callbacks are canceled on Restart/Reset.

## 6. Mobile and desktop

- The interface uses CSS Grid and Flexbox.
- Desktop layout uses side-by-side mode cards and four status cards.
- Smaller screens stack mode cards, use two-column stats and smaller keys.
- The on-screen keyboard allows touch input on phones and tablets.
- Responsive layouts have been checked at **1366px, 768px, 390px, and 320px**.

## 7. Teacher requirements checklist

- [x] Both required game modes
- [x] At least five rising letter bubbles
- [x] Correct and wrong key feedback, score and penalties
- [x] Bubble misses, speed progression and game over
- [x] KeyMagnet target set generated from an array
- [x] KeyMagnet correct, wrong and response-time tracking
- [x] Easy, Medium and Hard affect gameplay
- [x] Start, Restart and Reset with no page reload
- [x] Score and live status indicators
- [x] End-of-game performance summary for each mode
- [x] Timer/animation cleanup on game end or restart
- [x] Responsive desktop and mobile layout

## 8. Testing performed

Browser checks covered correct and wrong keypresses, Bubbles reaching the miss
limit, completing all 15 KeyMagnet Easy rounds, timed-out targets, difficulty
selection, Restart, Reset, the virtual keyboard, and desktop/mobile widths.

The demo video is a sample recording. For your submission, record your own
full gameplay demonstration and explain the code in the viva.
