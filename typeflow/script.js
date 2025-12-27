const PARAGRAPHS = [
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet at least once.",
    "To be or not to be, that is the question: whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune.",
    "In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move.",
    "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
    "A journey of a thousand miles begins with a single step. The only way to do great work is to love what you do."
];

const elements = {
    textDisplay: document.getElementById('text-display'),
    wpmDisplay: document.getElementById('wpm'),
    accuracyDisplay: document.getElementById('accuracy'),
    timerDisplay: document.getElementById('timer'),
    modal: document.getElementById('results-modal'),
    finalWpm: document.getElementById('final-wpm'),
    finalAccuracy: document.getElementById('final-accuracy'),
    finalTime: document.getElementById('final-time'),
    restartBtn: document.getElementById('restart-btn'),
    hiddenInput: document.getElementById('hidden-input')
};

let gameState = {
    text: '',
    currentIndex: 0,
    startTime: null,
    timerInterval: null,
    totalErrors: 0,
    typedChars: 0,
    status: 'idle' // 'idle', 'playing', 'finished'
};

function initGame() {
    // Reset State
    gameState.text = PARAGRAPHS[Math.floor(Math.random() * PARAGRAPHS.length)];
    gameState.currentIndex = 0;
    gameState.startTime = null;
    gameState.totalErrors = 0;
    gameState.typedChars = 0;
    gameState.status = 'idle';

    clearInterval(gameState.timerInterval);

    // Reset UI
    elements.timerDisplay.textContent = '0s';
    elements.wpmDisplay.textContent = '0';
    elements.accuracyDisplay.textContent = '100%';
    elements.modal.classList.remove('visible');
    elements.textDisplay.classList.remove('blur');

    renderText();

    // Focus invisible input to capture mobile keyboard if needed
    elements.hiddenInput.focus();
}

function renderText() {
    elements.textDisplay.innerHTML = '';
    gameState.text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.classList.add('char');
        // Mark first char as current
        if (index === 0) span.classList.add('current');
        elements.textDisplay.appendChild(span);
    });
}

function startGame() {
    if (gameState.status === 'playing') return;
    gameState.status = 'playing';
    gameState.startTime = new Date();
    gameState.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsed = Math.floor((new Date() - gameState.startTime) / 1000);
    elements.timerDisplay.textContent = `${elapsed}s`;

    // Calculate live WPM/Accuracy
    calculateMetrics();
}

function calculateMetrics() {
    if (!gameState.startTime) return;

    const timeInMinutes = (new Date() - gameState.startTime) / 60000;
    const correctChars = gameState.currentIndex - gameState.totalErrors; // Simplified approximation for live stats

    // WPM = (All typed entries / 5) / Time
    // Standard WPM usually counts all "correct" keystrokes (5 chars = 1 word)
    // Here we will use consistent WPM formula: (Correct Characters / 5) / Time
    const wpm = Math.round((gameState.currentIndex / 5) / timeInMinutes) || 0;

    // Accuracy
    const totalTyped = gameState.typedChars;
    const accuracy = totalTyped > 0
        ? Math.round(((totalTyped - gameState.totalErrors) / totalTyped) * 100)
        : 100;

    elements.wpmDisplay.textContent = wpm;
    elements.accuracyDisplay.textContent = `${accuracy}%`;

    return { wpm, accuracy, time: Math.floor(timeInMinutes * 60) };
}

function endGame() {
    gameState.status = 'finished';
    clearInterval(gameState.timerInterval);

    const { wpm, accuracy, time } = calculateMetrics();

    elements.finalWpm.textContent = wpm;
    elements.finalAccuracy.textContent = `${accuracy}%`;
    elements.finalTime.textContent = `${time}s`;

    elements.modal.classList.add('visible');
    elements.textDisplay.classList.add('blur');
}

function handleInput(key) {
    if (gameState.status === 'finished') return;

    const charSpans = elements.textDisplay.querySelectorAll('.char');
    const targetChar = gameState.text[gameState.currentIndex];

    // Start game on first valid input
    if (gameState.status === 'idle') {
        startGame();
    }

    gameState.typedChars++;

    if (key === targetChar) {
        // Correct
        charSpans[gameState.currentIndex].classList.add('correct');
        charSpans[gameState.currentIndex].classList.remove('current');

        gameState.currentIndex++;

        // Check win condition
        if (gameState.currentIndex >= gameState.text.length) {
            endGame();
            return;
        }

        // Move cursor
        if (gameState.currentIndex < charSpans.length) {
            charSpans[gameState.currentIndex].classList.add('current');
        }
    } else {
        // Incorrect
        charSpans[gameState.currentIndex].classList.add('incorrect');
        gameState.totalErrors++;
        // We do NOT advance cursor on error, mimicking some modes (or we could, but typical is "stop on error" or "continue with red")
        // PRD says: "Incorrect characters should remain highlighted". 
        // "Backspace should: Move cursor back, Remove applied styles"
        // This implies we DO advance or at least allow retrying. 
        // "Incorrect characters turn red with 50% opacity" -> usually implies text 'turns' red.
        // If I type 'a' instead of 'b', does 'b' turn red? Yes.
        // Should I advance? "TypeFlow solves this by ... Providing per-character feedback instantly".
        // If user creates a mess, they need to backspace.
        // Let's implement: Error marks current char red, DOES NOT advance, user must Backspace to retry? 
        // OR: Error marks current char red, advances cursor?
        // PRD: "Backspace should Move cursor back". That implies we can move forward even if wrong?
        // Let's try: Advance on error too, but mark it red.

        charSpans[gameState.currentIndex].classList.add('incorrect');
        charSpans[gameState.currentIndex].classList.remove('current');

        gameState.currentIndex++;

        if (gameState.currentIndex >= gameState.text.length) {
            endGame();
            return;
        }

        if (gameState.currentIndex < charSpans.length) {
            charSpans[gameState.currentIndex].classList.add('current');
        }
    }
}

function handleBackspace() {
    if (gameState.currentIndex > 0 && gameState.status !== 'finished') {
        const charSpans = elements.textDisplay.querySelectorAll('.char');

        // Remove current cursor
        if (gameState.currentIndex < charSpans.length) {
            charSpans[gameState.currentIndex].classList.remove('current');
        }

        gameState.currentIndex--;

        // Reset state of previous char
        const prevSpan = charSpans[gameState.currentIndex];
        prevSpan.classList.remove('correct', 'incorrect');
        prevSpan.classList.add('current');
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    // Ignore modifiers, etc.
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === 'Backspace') {
        handleBackspace();
        return;
    }

    if (e.key.length === 1) {
        handleInput(e.key);
    }
});

// Restart
elements.restartBtn.addEventListener('click', () => {
    initGame();
    // Refocus after click
    elements.hiddenInput.focus();
});

// Click anywhere to focus hidden input (for mobile/lost focus)
document.addEventListener('click', (e) => {
    if (e.target !== elements.restartBtn && !elements.modal.classList.contains('visible')) {
        elements.hiddenInput.focus();
    }
});

// Initialize
initGame();
