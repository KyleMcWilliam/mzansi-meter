document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const leaderboardScreen = document.getElementById('leaderboard-screen');

    const startButton = document.getElementById('start-button');
    const dailyChallengeButton = document.getElementById('daily-challenge-button');
    const leaderboardButton = document.getElementById('leaderboard-button');
    const gameLeaderboardButton = document.getElementById('game-leaderboard-button');
    const backToStartButton = document.getElementById('back-to-start-button');
    const restartButton = document.getElementById('restart-button');
    const shareButton = document.getElementById('share-button');
    const higherButton = document.getElementById('higher-button');
    const lowerButton = document.getElementById('lower-button');
    const howToPlayButton = document.getElementById('how-to-play-button');
    const howToPlayModal = document.getElementById('how-to-play-modal');
    const closeModalButton = howToPlayModal.querySelector('.close-button');

    const questionText = document.getElementById('question-text');
    const presentedValue = document.getElementById('presented-value');
    // NEW: Image elements
    const questionImageContainer = document.getElementById('question-image-container');
    const questionImage = document.getElementById('question-image');

    const currentScoreDisplay = document.getElementById('current-score');
    const currentStreakDisplay = document.getElementById('current-streak');
    const livesDisplay = document.getElementById('lives-display'); // NEW
    const finalScoreDisplay = document.getElementById('final-score');
    const highScoreStartDisplay = document.getElementById('high-score-start');
    const gradedTitleDisplay = document.getElementById('graded-title');
    const gameContainer = document.getElementById('game-container');
    const card = document.getElementById('card');
    const answerPopup = document.getElementById('answer-popup');
    
    // NEW: Timer elements
    const timerBar = document.getElementById('timer-bar');

    // Leaderboard elements
    const leaderboardTitle = document.getElementById('leaderboard-title');
    const leaderboardList = document.getElementById('leaderboard-list');
    const showDailyLeaderboardButton = document.getElementById('show-daily-leaderboard');
    const showAllTimeLeaderboardButton = document.getElementById('show-all-time-leaderboard');
    const highscoreInputContainer = document.getElementById('highscore-input-container');
    const playerInitials = document.getElementById('player-initials');
    const submitScoreButton = document.getElementById('submit-score-button');

    // NEW: Answer reveal elements
    const revealQuestionText = document.getElementById('reveal-question-text');
    const revealCorrectAnswer = document.getElementById('reveal-correct-answer');

    // NEW: Mute Button Logic
    let isMuted = localStorage.getItem('mzansiMeterMuted') === 'true';
    let lastClickCoordinates = { x: 0, y: 0 }; // Store coordinates for floating text

    // Theme Toggle Logic
    const storedTheme = localStorage.getItem('mzansiTheme'); // Updated key as per request or stick to old key? User snippet says 'mzansiTheme'

    // Apply stored theme immediately
    if (storedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    const hadedaSound = document.getElementById('wrong-answer-hadeda');
    const taxiSound = document.getElementById('wrong-answer-taxi');
    const correctSound = document.getElementById('correct-answer-sound'); // NEW
    const clickSound = document.getElementById('click-sound'); // NEW
    const confettiCanvas = document.getElementById('confetti-canvas');
    const customConfetti = confetti.create(confettiCanvas, {
        resize: true,
        useWorker: true
    });

    // --- Game State ---
    let currentScore = 0;
    let currentStreak = 0;
    let lives = 3; // NEW
    let highScore = localStorage.getItem('mzansiMeterHighScore') || 0;
    let questions = [];
    let availableQuestions = [];
    let currentQuestion = {};
    let isDailyChallenge = false; // To track game mode
    const QUESTION_TIME = 10000; // 10 seconds in milliseconds
    let questionTimer; // NEW: Timer variable
    let db; // Firebase Firestore instance
    let previousScreen = 'start';

    // --- Firebase SDK ---
    const firebaseConfig = {
        apiKey: "AIzaSyAj6VSGZxEZhK1cxlwLl6dkOlWN2MwWpqE",
        authDomain: "mzanzi-meter.firebaseapp.com",
        projectId: "mzanzi-meter",
        storageBucket: "mzanzi-meter.firebasestorage.app",
        messagingSenderId: "133492065727",
        appId: "1:133492065727:web:98817a2a3e7e3426734d0a",
        measurementId: "G-HS5RX6953L"
    };

    // Initialize Firebase
    try {
        const app = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
    } catch (e) {
        console.error("Firebase initialization failed:", e);
        showToast("Could not connect to the leaderboard. Please check the console for details.", 'error');
    }


    // --- Fetch and Initialize ---
    // Fetch questions from Firestore or fallback to JSON
    async function loadQuestions() {
        if (db) {
            try {
                const snapshot = await db.collection('questions').get();
                if (!snapshot.empty) {
                    questions = snapshot.docs.map(doc => doc.data());
                    console.log("Questions loaded from Firestore:", questions.length);
                    init();
                    return;
                }
            } catch (error) {
                console.error("Error loading questions from Firestore:", error);
            }
        }

        // Fallback to local JSON if Firestore fails or is empty (dev environment)
        try {
            const response = await fetch('questions.json');
            questions = await response.json();
            console.log("Questions loaded from local JSON:", questions.length);
            init();
        } catch (error) {
            console.error("Error loading local questions:", error);
            showToast("Error loading game data. Please refresh.", "error");
            init(); // Try to init anyway
        }
    }

    loadQuestions();


    function init() {
        highScoreStartDisplay.textContent = highScore;

        // Add click sound to all buttons
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                playSound(clickSound);
                // Capture coordinates for any button, though we mainly use it for higher/lower
                if (e.clientX && e.clientY) {
                    lastClickCoordinates = { x: e.clientX, y: e.clientY };
                }
            });
        });

        startButton.addEventListener('click', startEndlessGame);
        dailyChallengeButton.addEventListener('click', startDailyChallenge);
        restartButton.addEventListener('click', () => {
            if (isDailyChallenge) {
                startDailyChallenge();
            } else {
                startEndlessGame();
            }
        });
        higherButton.addEventListener('click', () => checkAnswer('higher'));
        lowerButton.addEventListener('click', () => checkAnswer('lower'));
        shareButton.addEventListener('click', shareScore);

        // New Listeners
        leaderboardButton.addEventListener('click', () => showLeaderboard('start', 'all-time'));
        gameLeaderboardButton.addEventListener('click', () => showLeaderboard('game', 'all-time'));
        showDailyLeaderboardButton.addEventListener('click', () => showLeaderboard(previousScreen, 'daily'));
        showAllTimeLeaderboardButton.addEventListener('click', () => showLeaderboard(previousScreen, 'all-time'));
        backToStartButton.addEventListener('click', () => {
            switchScreen(previousScreen);
            if (previousScreen === 'game') {
                startTimer(); // Resume timer when going back to the game
            }
        });
        submitScoreButton.addEventListener('click', submitScore);

        // How to Play Modal Listeners
        howToPlayButton.addEventListener('click', () => {
            howToPlayModal.style.display = 'block';
        });

        closeModalButton.addEventListener('click', () => {
            howToPlayModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target == howToPlayModal) {
                howToPlayModal.style.display = 'none';
            }
        });

        // --- Mute Logic (Handle both buttons) ---
        const muteBtns = [
            document.getElementById('mute-button-start'),
            document.getElementById('mute-button-game')
        ];

        function updateMuteButtons() {
            muteBtns.forEach(btn => {
                if (btn) {
                    btn.textContent = isMuted ? '🔇' : '🔊';
                    btn.setAttribute('aria-label', isMuted ? 'Unmute Sound' : 'Mute Sound');
                }
            });
        }

        // Attach listeners
        muteBtns.forEach(btn => {
            if (btn) btn.addEventListener('click', () => {
                isMuted = !isMuted;
                localStorage.setItem('mzansiMeterMuted', isMuted);
                updateMuteButtons();
            });
        });

        // Initialize state
        updateMuteButtons();

        // --- Theme Logic (Handle both buttons) ---
        const themeBtns = [
            document.getElementById('theme-toggle-start'),
            document.getElementById('theme-toggle-game')
        ];

        function toggleTheme() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('mzansiTheme', isDark ? 'dark' : 'light');
        }

        themeBtns.forEach(btn => {
            if (btn) btn.addEventListener('click', toggleTheme);
        });

        // Initialize Daily Streak Badge
        checkStreak();

        // Hide loading screen once initialized
        document.getElementById('loading-screen').style.display = 'none';
    }

    // --- Game Flow ---
    function startEndlessGame() {
        isDailyChallenge = false;
        availableQuestions = [...questions];

        // Shuffle the questions to ensure variety
        for (let i = availableQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
        }

        if (availableQuestions.length > 75) {
            availableQuestions = availableQuestions.slice(0, 75);
        }

        startGame();
    }

    async function startDailyChallenge() {
        isDailyChallenge = true;

        // Show a loading state
        dailyChallengeButton.disabled = true;
        dailyChallengeButton.textContent = 'Loading...';

        try {
            if (!questions || questions.length === 0) {
                 // Try fetching if not loaded yet (e.g. direct nav)
                 const snapshot = await db.collection('questions').get();
                 questions = snapshot.docs.map(doc => doc.data());
            }

            if (questions.length === 0) {
                throw new Error("No questions available");
            }

            // Client-side daily seeding logic
            const today = new Date();
            const year = today.getUTCFullYear();
            const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
            const day = today.getUTCDate().toString().padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            // Create a numeric seed from the date string
            let seed = 0;
            for (let i = 0; i < dateString.length; i++) {
                seed = (seed * 31 + dateString.charCodeAt(i)) & 0xFFFFFFFF;
            }

            const seededRandom = createSeededRandom(seed);

            // Generate a predictable, shuffled sequence of indices
            const allQuestionIndices = Array.from({ length: questions.length }, (_, i) => i);
            const shuffledIndices = shuffleArray(allQuestionIndices, seededRandom);

            // Take the first 10 indices for the daily challenge
            const dailyQuestionIndices = shuffledIndices.slice(0, 10);
            availableQuestions = dailyQuestionIndices.map(index => questions[index]);

            // Preload the first couple of images for a smoother experience
            preloadImages();

            startGame();

        } catch (error) {
            console.error('Failed to load daily challenge:', error);
            showToast('Could not load the Daily Challenge. Please try again later.', 'error');
        } finally {
            // Restore button state
            dailyChallengeButton.disabled = false;
            dailyChallengeButton.textContent = 'Daily Challenge';
        }
    }

    // --- Helper Functions for Randomness ---
    function createSeededRandom(seed) {
        let state = seed;
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;

        return function() {
            state = (a * state + c) % m;
            return state / m;
        };
    }

    function shuffleArray(array, seededRandom) {
        let m = array.length, t, i;
        while (m) {
            i = Math.floor(seededRandom() * m--);
            t = array[m];
            array[m] = array[i];
            array[i] = t;
        }
        return array;
    }

    function startGame() {
        currentScore = 0;
        currentStreak = 0;
        lives = 3; // Reset lives
        updateScoreDisplay();
        updateLivesDisplay(); // Update lives UI

        if (!availableQuestions || availableQuestions.length === 0) {
            showToast('Error: Questions not loaded. Please refresh the page.', 'error');
            return;
        }

        switchScreen('game');
        nextQuestion();
    }


    async function endGame(reason = "Wrong answer!") {
        clearTimeout(questionTimer); // NEW: Stop the timer
        
        // NEW: Populate and show the correct answer
        revealQuestionText.textContent = `Regarding: "${currentQuestion.question}"`;
        revealCorrectAnswer.textContent = formatValue(currentQuestion.value, currentQuestion.format);
        document.getElementById('final-score-title').textContent = reason;

        finalScoreDisplay.textContent = currentScore;
        updateHighScore();
        gradedTitleDisplay.textContent = getGradedTitle(currentScore);
        playWrongAnswerSound();
        switchScreen('end');

        // Leaderboard check
        if (db) {
            try {
                let leaderboardQuery;
                if (isDailyChallenge) {
                    const dateStr = getYYYYMMDD();
                    leaderboardQuery = db.collection('leaderboard_daily')
                                           .where('date', '==', dateStr)
                                           .orderBy('score', 'desc')
                                           .limit(10);

                    const today = getYYYYMMDD();
                    const lastPlay = localStorage.getItem('lastDailyDate');

                    // Only increment if they haven't played today already
                    if (lastPlay !== today) {
                        let streak = parseInt(localStorage.getItem('currentStreak') || '0');
                        streak++;
                        localStorage.setItem('currentStreak', streak);
                        localStorage.setItem('lastDailyDate', today);
                        showToast(`🔥 Daily Streak: ${streak}!`, 'success');
                    }
                } else {
                    leaderboardQuery = db.collection('leaderboard')
                                           .orderBy('score', 'desc')
                                           .limit(10);
                }
                const snapshot = await leaderboardQuery.get();

                const scores = [];
                snapshot.forEach(doc => {
                    scores.push(doc.data().score);
                });

                const lowestScoreOnLeaderboard = scores.length > 0 ? scores[scores.length - 1] : 0;

                // Show input if the user's score is high enough
                if (currentScore > 0 && (scores.length < 10 || currentScore > lowestScoreOnLeaderboard)) {
                    highscoreInputContainer.style.display = 'block';
                } else {
                    highscoreInputContainer.style.display = 'none';
                }
            } catch (error) {
                console.error("Error checking leaderboard eligibility:", error);
                // Hide the input container on error to prevent issues
                highscoreInputContainer.style.display = 'none';
            }
        }
    }

function nextQuestion() {
    clearTimeout(questionTimer);
    higherButton.disabled = false;
    lowerButton.disabled = false;

    card.classList.add('is-flipped');

    setTimeout(() => {
        if (availableQuestions.length === 0) {
            endGame("You answered all the questions!");
            return;
        }

        if (isDailyChallenge) {
            currentQuestion = availableQuestions.shift();
        } else {
            const questionIndex = Math.floor(Math.random() * availableQuestions.length);
            currentQuestion = availableQuestions.splice(questionIndex, 1)[0];
        }

        if (currentQuestion.image) {
            questionImage.src = currentQuestion.image;
            questionImageContainer.style.display = 'block';
        } else {
            questionImageContainer.style.display = 'none';
        }

        const actualValue = currentQuestion.value;
        let presentedNumber;

        // This loop ensures the presented value is never the same as the actual value after formatting.
        do {
            let offset;
            if (currentQuestion.format === 'year') {
                offset = Math.floor(Math.random() * 46) + 5;
                if (actualValue - offset < 1000) {
                    presentedNumber = actualValue + offset;
                } else {
                    presentedNumber = Math.random() < 0.5 ? actualValue + offset : actualValue - offset;
                }
            } else {
                offset = (Math.random() * 0.4 + 0.2) * actualValue;
                presentedNumber = Math.random() < 0.5 ? actualValue + offset : actualValue - offset;
                if (presentedNumber <= 0) {
                    presentedNumber = actualValue / 2;
                }
            }
            // Temporarily format to check for collision before assigning to the DOM
            const formattedPresentedValue = formatValue(presentedNumber, currentQuestion.format);
            const formattedActualValue = formatValue(actualValue, currentQuestion.format);

            if (formattedPresentedValue !== formattedActualValue) {
                break; // The values are different, we can exit the loop.
            }
        } while (true);


        presentedValue.textContent = formatValue(presentedNumber, currentQuestion.format);
        questionText.textContent = currentQuestion.question;

        card.classList.remove('is-flipped');
        startTimer();
    }, 300); // Halfway through the 0.6s flip
}

    // --- Answer Logic ---
    function checkAnswer(guess) {
        clearTimeout(questionTimer); // Stop the timer

        // Disable buttons immediately to prevent multiple guesses
        higherButton.disabled = true;
        lowerButton.disabled = true;

        const cardFront = document.getElementById('card-front');
        const displayedNumberText = presentedValue.textContent.replace('R', '').replace(/,/g, '');
        const displayedNumber = parseFloat(displayedNumberText);
        const actualValue = currentQuestion.value;
        const isCorrect = (guess === 'higher' && actualValue > displayedNumber) || (guess === 'lower' && actualValue < displayedNumber);

        if (isCorrect) {
            // --- CORRECT ANSWER ---
            cardFront.classList.add('correct');
            answerPopup.innerHTML = `Correct!<br>The answer was ${formatValue(currentQuestion.value, currentQuestion.format)}`;
            answerPopup.style.backgroundColor = 'rgba(0, 122, 77, 0.95)'; // Green
            currentScore++;
            currentStreak++;
            updateScoreDisplay();
            playSound(correctSound); // Play correct sound
            triggerConfetti();
            showFloatingText(lastClickCoordinates.x, lastClickCoordinates.y, true); // NEW: Floating Text
            if (navigator.vibrate) navigator.vibrate(50);
        } else {
            // --- INCORRECT ANSWER ---
            card.classList.add('shake');
            cardFront.classList.add('incorrect');
            answerPopup.innerHTML = `Eish! The right answer was ${formatValue(currentQuestion.value, currentQuestion.format)}`;
            answerPopup.style.backgroundColor = 'rgba(222, 56, 49, 0.95)'; // Red

            // Lives Logic
            lives--;
            currentStreak = 0;
            updateScoreDisplay();
            updateLivesDisplay();

            showFloatingText(lastClickCoordinates.x, lastClickCoordinates.y, false); // NEW: Floating Text

            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            playWrongAnswerSound();
        }

        // Show the answer popup
        answerPopup.classList.add('show');

        // Wait, then proceed.
        // We reduce this to 1000ms so the user can see the result,
        // then we fade it out AS the next question loads.
        setTimeout(() => {
            // Start fading out the popup
            answerPopup.classList.remove('show');

            // Allow the popup fade-out to overlap with the card flip/reset
            // The CSS transition is 0.3s. The card flip is 0.6s.

            cardFront.classList.remove('correct', 'incorrect');
            card.classList.remove('shake'); // Remove shake after animation

            if (isCorrect) {
                nextQuestion();
            } else {
                if (lives > 0) {
                    showToast(`Eish! That was wrong. You have ${lives} lives left.`, 'error');
                    nextQuestion();
                } else {
                    endGame(`Eish, you're out of lives!`);
                }
            }
        }, 1000);
    }

    function triggerConfetti() {
        const scoreRect = currentScoreDisplay.getBoundingClientRect();
        const origin = {
            x: (scoreRect.left + scoreRect.right) / 2 / window.innerWidth,
            y: (scoreRect.top + scoreRect.bottom) / 2 / window.innerHeight
        };

        customConfetti({
            particleCount: 100,
            spread: 70,
            origin: origin,
            colors: ['#007A4D', '#FFB612', '#262626'] // Green, Gold, Black
        });
    }

    /**
     * Preloads the images for the first two questions in the daily challenge queue.
     * This is a performance optimization to prevent a visual "pop-in" of the image
     * when the question appears, creating a smoother user experience.
     */
    function preloadImages() {
        const questionsToPreload = availableQuestions.slice(0, 2);
        for (const question of questionsToPreload) {
            if (question.image) {
                const img = new Image();
                img.src = question.image;
            }
        }
    }

    // --- NEW: Timer Functions ---
    function startTimer() {
        // Reset animation
        timerBar.classList.remove('animating');
        void timerBar.offsetWidth; // Trigger reflow

        // Start animation
        timerBar.style.animationDuration = `${QUESTION_TIME / 1000}s`;
        timerBar.classList.add('animating');

        // Set timeout for game over
        questionTimer = setTimeout(() => handleTimeUp(), QUESTION_TIME);
    }

    function handleTimeUp() {
        lives--;
        currentStreak = 0;
        updateScoreDisplay();
        updateLivesDisplay();

        playWrongAnswerSound();

        if (lives > 0) {
            showToast("Time's up! You lost a life.", 'error');
            nextQuestion();
        } else {
            endGame("Time's up, my bru! Game over.");
        }
    }


    // --- Floating Text Logic ---
    function showFloatingText(x, y, isPositive) {
        const positiveWords = ["Lekker!", "Sho!", "Laduma!", "Sharp!", "Yebo!", "Aweh!", "Heita!"];
        const negativeWords = ["Eish!", "Hawu!", "Ag no!", "Yoh!", "Haikona!", "Tsek!", "Aikona!"];

        const words = isPositive ? positiveWords : negativeWords;
        const text = words[Math.floor(Math.random() * words.length)];

        const el = document.createElement('div');
        el.className = `floating-text ${isPositive ? 'positive' : 'negative'}`;
        el.textContent = text;

        // Ensure it's within viewport bounds roughly
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        document.body.appendChild(el);

        // Remove after animation
        setTimeout(() => {
            el.remove();
        }, 1000);
    }

    // --- UI & Helpers ---
    function formatValue(value, format) {
        switch (format) {
            case 'currency':
                // Format as currency with two decimal places and comma separators.
                return `R${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            case 'number':
                 // Format with comma separators for thousands.
                return Math.round(value).toLocaleString('en-US');
            case 'year':
            default:
                // Years and other formats don't need special formatting.
                return Math.round(value);
        }
    }
    
    function switchScreen(screenName) {
        const currentScreen = document.querySelector('.screen.active');
        const nextScreen = document.getElementById(`${screenName}-screen`);

        if (!currentScreen || currentScreen === nextScreen) {
            if (currentScreen) currentScreen.classList.remove('active');
            nextScreen.classList.add('active');
            return;
        }

        // Determine direction based on screen flow
        // Flow: Start -> Game -> End
        // Screens: 'start', 'game', 'end', 'leaderboard'
        let direction = 'up'; // Default: next screen slides up

        const flowOrder = ['start', 'game', 'end'];
        const currentIndex = flowOrder.indexOf(currentScreen.id.replace('-screen', ''));
        const nextIndex = flowOrder.indexOf(screenName);

        if (currentIndex !== -1 && nextIndex !== -1) {
            if (nextIndex < currentIndex) {
                direction = 'down';
            }
        } else if (screenName === 'leaderboard') {
             direction = 'up';
        } else if (currentScreen.id === 'leaderboard-screen') {
             direction = 'down';
        }

        // Apply animations
        const exitClass = direction === 'up' ? 'slide-up-exit' : 'slide-down-exit';
        const enterClass = direction === 'up' ? 'slide-up-enter' : 'slide-down-enter';

        currentScreen.classList.add(exitClass);
        nextScreen.classList.add('active', enterClass);

        // Cleanup after animation
        nextScreen.addEventListener('animationend', () => {
            currentScreen.classList.remove('active', 'slide-up-exit', 'slide-down-exit');
            nextScreen.classList.remove('slide-up-enter', 'slide-down-enter');
        }, { once: true });
    }

    function updateScoreDisplay() {
        currentScoreDisplay.textContent = currentScore;
        currentStreakDisplay.textContent = currentStreak;
    }

    function updateLivesDisplay() {
        let hearts = '';
        for (let i = 0; i < lives; i++) {
            hearts += '❤️';
        }
        livesDisplay.textContent = hearts;
    }

    function updateHighScore() {
        if (currentScore > highScore) {
            highScore = currentScore;
            localStorage.setItem('mzansiMeterHighScore', highScore);
            highScoreStartDisplay.textContent = highScore;
        }
    }

    async function showLeaderboard(from, type = 'all-time') {
        if (from) {
            previousScreen = from;
        }
        if (previousScreen === 'game') {
            clearTimeout(questionTimer);
        }
        switchScreen('leaderboard');

        leaderboardList.innerHTML = '<li>Loading...</li>';

        if (!db) {
            leaderboardList.innerHTML = '<li>Error: Leaderboard is not available.</li>';
            return;
        }

        let query;
        if (type === 'daily') {
            const dateStr = getYYYYMMDD();
            leaderboardTitle.textContent = `Today's Leaderboard (${dateStr})`;
            query = db.collection('leaderboard_daily')
                      .where('date', '==', dateStr)
                      .orderBy('score', 'desc')
                      .limit(20);
            showDailyLeaderboardButton.classList.remove('secondary');
            showAllTimeLeaderboardButton.classList.add('secondary');
        } else {
            leaderboardTitle.textContent = 'All-Time Leaderboard';
            query = db.collection('leaderboard')
                      .orderBy('score', 'desc')
                      .limit(20);
            showAllTimeLeaderboardButton.classList.remove('secondary');
            showDailyLeaderboardButton.classList.add('secondary');
        }

        try {
            const snapshot = await query.get();

            if (snapshot.empty) {
                leaderboardList.innerHTML = `<li>No scores yet. Be the first!</li>`;
                return;
            }

            leaderboardList.innerHTML = ''; // Clear loading message
            let rank = 1;
            snapshot.forEach(doc => {
                const data = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `<span>${rank}. ${data.name}</span><span>${data.score}</span>`;
                leaderboardList.appendChild(li);
                rank++;
            });
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            leaderboardList.innerHTML = '<li>Could not load leaderboard. This might be a temporary issue. Please try again later.</li>';
        }
    }

    async function submitScore() {
        const name = playerInitials.value.trim().toUpperCase();
        if (!name || name.length < 3) {
            showToast("Please enter your 3 initials.", 'info');
            return;
        }

        submitScoreButton.disabled = true;
        submitScoreButton.textContent = 'Submitting...';

        const scoreData = {
            name: name,
            score: currentScore,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        let collectionName = 'leaderboard';
        if (isDailyChallenge) {
            collectionName = 'leaderboard_daily';
            scoreData.date = getYYYYMMDD(); // Add date for daily scores
        }

        try {
            if (!db) throw new Error("Firestore is not initialized.");
            await db.collection(collectionName).add(scoreData);
            highscoreInputContainer.innerHTML = '<p>Your score has been submitted!</p>';
            // After submitting a daily score, show the daily leaderboard
            setTimeout(() => showLeaderboard('start', isDailyChallenge ? 'daily' : 'all-time'), 1500);
        } catch (error) {
            console.error("Error submitting score:", error);
            showToast("There was an error submitting your score. Please try again.", 'error');
            submitScoreButton.disabled = false;
            submitScoreButton.textContent = 'Submit';
        }
    }

    function getYYYYMMDD() {
        const today = new Date();
        const year = today.getUTCFullYear();
        const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = today.getUTCDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    function getGradedTitle(score) {
        if (score <= 1) return "Just Landed";
        if (score <= 3) return "Certified Saffa";
        if (score <= 5) return "Braai Master in Training";
        if (score <= 7) return "Local Legend";
        if (score <= 10) return "You ARE the Potjie!";
        if (score <= 15) return "Honorary National Treasure";
        if (score > 15) return "The Real Madiba Magic!";
    }

    function playWrongAnswerSound() {
        if (isMuted) return;
        // Randomly choose between hadeda and taxi sound
        const soundToPlay = Math.random() > 0.5 ? hadedaSound : taxiSound;
        playSound(soundToPlay);
    }

    function playSound(audioElement) {
        if (isMuted || !audioElement) return;
        audioElement.currentTime = 0; // Reset to start
        audioElement.play().catch(e => console.log("Audio play failed:", e));
    }

    function updateOgTags(score, title) {
        const ogTitle = `I scored ${score} on The Mzansi Meter!`;
        const ogDescription = `They call me "${title}". Think you can do better, boet?`;
        // Construct the full URL for the image generation API
        const imageUrl = `${window.location.origin}/api/generate-image?score=${score}&title=${encodeURIComponent(title)}`;

        // Define the meta tags to update or create
        const metas = {
            'og:title': ogTitle,
            'og:description': ogDescription,
            'og:image': imageUrl,
            'twitter:card': 'summary_large_image',
            'twitter:title': ogTitle,
            'twitter:description': ogDescription,
            'twitter:image': imageUrl,
        };

        // Loop through the defined meta tags
        for (const [property, content] of Object.entries(metas)) {
            let meta = document.querySelector(`meta[property='${property}']`);
            // If a meta tag doesn't exist, create it
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('property', property);
                document.head.appendChild(meta);
            }
            // Set the content of the meta tag
            meta.setAttribute('content', content);
        }
    }

    async function shareScore() {
        const score = currentScore;
        const title = getGradedTitle(score);
        updateOgTags(score, title); // This part is perfect as is

        const shareText = `I scored ${score} on The Mzansi Meter and earned the title "${title}"! 🇿🇦 Think you know SA better? Prove it, boet! #MzansiMeter`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'The Mzansi Meter Challenge',
                    text: shareText,
                    url: window.location.href
                });
            } catch (error) {
                console.error('Error sharing:', error);
                copyToClipboard(shareText);
            }
        } else {
            copyToClipboard(shareText);
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast("Score copied to clipboard! Now go and brag on social media.", 'success');
        }).catch(err => { console.error('Failed to copy: ', err); });
    }

    // --- Toast Notification System ---
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = '';
        if (type === 'success') icon = '✅';
        else if (type === 'error') icon = '❌';
        else icon = 'ℹ️';

        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300); // Wait for transition to finish
        }, 3000);
    }

    function checkStreak() {
        const today = getYYYYMMDD();
        const lastPlay = localStorage.getItem('lastDailyDate');
        let streak = parseInt(localStorage.getItem('currentStreak') || '0');
        const badge = document.getElementById('daily-streak-badge');
        const countSpan = document.getElementById('streak-count');

        if (lastPlay) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            // If last played before yesterday, reset streak
            if (lastPlay !== today && lastPlay !== yesterdayStr) {
                streak = 0;
                localStorage.setItem('currentStreak', 0);
            }
        }

        // Show badge if streak > 0
        if (streak > 0 && badge && countSpan) {
            countSpan.textContent = streak;
            badge.style.display = 'inline-block'; // Matches CSS .streak-display
        }
    }

});
