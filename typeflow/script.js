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
    status: 'idle' 
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

    
    elements.timerDisplay.textContent = '0s';
    elements.wpmDisplay.textContent = '0';
    elements.accuracyDisplay.textContent = '100%';
    elements.modal.classList.remove('visible');
    elements.textDisplay.classList.remove('blur');

    renderText();

    
    elements.hiddenInput.focus();
}

function renderText() {
    elements.textDisplay.innerHTML = '';
    gameState.text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.classList.add('char');
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

    
    calculateMetrics();
}

function calculateMetrics() {
    if (!gameState.startTime) return;

    const timeInMinutes = (new Date() - gameState.startTime) / 60000;
    const correctChars = gameState.currentIndex - gameState.totalErrors; 

    const wpm = Math.round((gameState.currentIndex / 5) / timeInMinutes) || 0;


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


    if (gameState.status === 'idle') {
        startGame();
    }

    gameState.typedChars++;

    if (key === targetChar) {
     
        charSpans[gameState.currentIndex].classList.add('correct');
        charSpans[gameState.currentIndex].classList.remove('current');

        gameState.currentIndex++;

        if (gameState.currentIndex >= gameState.text.length) {
            endGame();
            return;
        }
        if (gameState.currentIndex < charSpans.length) {
            charSpans[gameState.currentIndex].classList.add('current');
        }
    } else {
        charSpans[gameState.currentIndex].classList.add('incorrect');
        gameState.totalErrors++;
       
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

      
        if (gameState.currentIndex < charSpans.length) {
            charSpans[gameState.currentIndex].classList.remove('current');
        }

        gameState.currentIndex--;
        const prevSpan = charSpans[gameState.currentIndex];
        prevSpan.classList.remove('correct', 'incorrect');
        prevSpan.classList.add('current');
    }
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === 'Backspace') {
        handleBackspace();
        return;
    }

    if (e.key.length === 1) {
        handleInput(e.key);
    }
});

elements.restartBtn.addEventListener('click', () => {
    initGame();
    elements.hiddenInput.focus();
});

document.addEventListener('click', (e) => {
    if (e.target !== elements.restartBtn && !elements.modal.classList.contains('visible')) {
        elements.hiddenInput.focus();
    }
});

initGame();

