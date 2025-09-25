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

    const hadedaSound = document.getElementById('wrong-answer-hadeda');
    const taxiSound = document.getElementById('wrong-answer-taxi');
    const confettiCanvas = document.getElementById('confetti-canvas');
    const customConfetti = confetti.create(confettiCanvas, {
        resize: true,
        useWorker: true
    });

    // --- Game State ---
    let currentScore = 0;
    let currentStreak = 0;
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
        alert("Could not connect to the leaderboard. Please check the console for details.");
    }


    // --- Fetch and Initialize ---
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data;
            init();
        });


    function init() {
        highScoreStartDisplay.textContent = highScore;
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
            const response = await fetch('/api/getDailySeed');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const dailyIndices = data.dailyQuestions;

            // Create the question list in the correct order
            availableQuestions = dailyIndices.map(index => questions[index]);

            startGame();

        } catch (error) {
            console.error('Failed to load daily challenge:', error);
            alert('Could not load the Daily Challenge. Please try again later.');
        } finally {
            // Restore button state
            dailyChallengeButton.disabled = false;
            dailyChallengeButton.textContent = 'Daily Challenge';
        }
    }

    function startGame() {
        currentScore = 0;
        currentStreak = 0;
        updateScoreDisplay();

        if (!availableQuestions || availableQuestions.length === 0) {
            alert('Error: Questions not loaded. Please refresh the page.');
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
                const collectionName = isDailyChallenge ? `leaderboard_daily_${getYYYYMMDD()}` : 'leaderboard';
                const leaderboardRef = db.collection(collectionName)
                                           .orderBy('score', 'desc')
                                           .limit(10);
                const snapshot = await leaderboardRef.get();

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
                // In Daily Challenge, questions are in order and not removed randomly
                currentQuestion = availableQuestions.shift();
            } else {
                // In Endless Mode, pick a random question
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
            let offset;
            let presentedNumber;

            // Check the format of the question to apply the correct logic
            if (currentQuestion.format === 'year') {
                // For years, use a smaller, more realistic offset (e.g., 5 to 50 years)
                offset = Math.floor(Math.random() * 46) + 5; // Random integer between 5 and 50

                // Ensure the presented year isn't nonsensical (e.g., before the year 1000)
                if (actualValue - offset < 1000) {
                    presentedNumber = actualValue + offset;
                } else {
                    presentedNumber = Math.random() < 0.5 ? actualValue + offset : actualValue - offset;
                }
            } else {
                // Original logic for currency and numbers, which works well
                offset = (Math.random() * 0.4 + 0.2) * actualValue;
                presentedNumber = Math.random() < 0.5 ? actualValue + offset : actualValue - offset;
                if (presentedNumber <= 0) {
                    presentedNumber = actualValue / 2;
                }
            }

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
            triggerConfetti();
            if (navigator.vibrate) navigator.vibrate(50);
        } else {
            // --- INCORRECT ANSWER ---
            cardFront.classList.add('incorrect');
            answerPopup.innerHTML = `Eish! The right answer was ${formatValue(currentQuestion.value, currentQuestion.format)}`;
            answerPopup.style.backgroundColor = 'rgba(222, 56, 49, 0.95)'; // Red
            currentStreak = 0;
            updateScoreDisplay();
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            playWrongAnswerSound();
        }

        // Show the answer popup
        answerPopup.classList.add('show');

        // Wait for 1.5 seconds, then proceed
        setTimeout(() => {
            answerPopup.classList.remove('show');
            cardFront.classList.remove('correct', 'incorrect');

            if (isCorrect) {
                nextQuestion();
            } else {
                endGame(`Eish, you got it wrong!`);
            }
        }, 1500);
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

    // --- NEW: Timer Functions ---
    function startTimer() {
        // Reset animation
        timerBar.style.transition = 'none';
        timerBar.style.transform = 'scaleX(1)';
        
        // Trigger reflow
        void timerBar.offsetWidth;

        // Start animation
        timerBar.style.transition = `transform ${QUESTION_TIME / 1000}s linear`;
        timerBar.style.transform = 'scaleX(0)';

        // Set timeout for game over
        questionTimer = setTimeout(() => endGame("Time's up, my bru!"), QUESTION_TIME);
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
    
    function switchScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screen}-screen`).classList.add('active');
    }

    function updateScoreDisplay() {
        currentScoreDisplay.textContent = currentScore;
        currentStreakDisplay.textContent = currentStreak;
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

        let collectionName;
        if (type === 'daily') {
            const dateStr = getYYYYMMDD();
            leaderboardTitle.textContent = `Today's Leaderboard (${dateStr})`;
            collectionName = `leaderboard_daily_${dateStr}`;
            showDailyLeaderboardButton.classList.remove('secondary');
            showAllTimeLeaderboardButton.classList.add('secondary');
        } else {
            leaderboardTitle.textContent = 'All-Time Leaderboard';
            collectionName = 'leaderboard';
            showAllTimeLeaderboardButton.classList.remove('secondary');
            showDailyLeaderboardButton.classList.add('secondary');
        }

        leaderboardList.innerHTML = '<li>Loading...</li>';

        if (!db) {
            leaderboardList.innerHTML = '<li>Error: Leaderboard is not available.</li>';
            return;
        }

        try {
            const leaderboardRef = db.collection(collectionName)
                                       .orderBy('score', 'desc')
                                       .limit(20);
            const snapshot = await leaderboardRef.get();

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
            alert("Please enter your 3 initials.");
            return;
        }

        submitScoreButton.disabled = true;
        submitScoreButton.textContent = 'Submitting...';

        const scoreData = {
            name: name,
            score: currentScore,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        const collectionName = isDailyChallenge ? `leaderboard_daily_${getYYYYMMDD()}` : 'leaderboard';

        try {
            if (!db) throw new Error("Firestore is not initialized.");
            await db.collection(collectionName).add(scoreData);
            highscoreInputContainer.innerHTML = '<p>Your score has been submitted!</p>';
            // After submitting a daily score, show the daily leaderboard
            setTimeout(() => showLeaderboard('start', isDailyChallenge ? 'daily' : 'all-time'), 1500);
        } catch (error) {
            console.error("Error submitting score:", error);
            alert("There was an error submitting your score. Please try again.");
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
        if (Math.random() > 0.5) hadedaSound.play();
        else taxiSound.play();
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
            alert("Score copied to clipboard! Now go and brag on social media.");
        }).catch(err => { console.error('Failed to copy: ', err); });
    }

});

window.onload = function() {
    document.getElementById('loading-screen').style.display = 'none';
};