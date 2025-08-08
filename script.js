document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const settingsModal = document.getElementById('settings-modal');

    const startButton = document.getElementById('start-button');
    const leaderboardButton = document.getElementById('leaderboard-button');
    const backToStartButton = document.getElementById('back-to-start-button');
    const restartButton = document.getElementById('restart-button');
    const shareButton = document.getElementById('share-button');
    const higherButton = document.getElementById('higher-button');
    const lowerButton = document.getElementById('lower-button');

    const questionText = document.getElementById('question-text');
    const presentedValue = document.getElementById('presented-value');
    // NEW: Image elements
    const questionImageContainer = document.getElementById('question-image-container');
    const questionImage = document.getElementById('question-image');

    const currentScoreDisplay = document.getElementById('current-score');
    const finalScoreDisplay = document.getElementById('final-score');
    const highScoreStartDisplay = document.getElementById('high-score-start');
    const gradedTitleDisplay = document.getElementById('graded-title');
    const gameContainer = document.getElementById('game-container');
    const card = document.getElementById('card');
    const answerPopup = document.getElementById('answer-popup');
    
    // NEW: Timer elements
    const timerBar = document.getElementById('timer-bar');

    // Settings Modal elements
    const settingsIcon = document.getElementById('settings-icon');
    const closeButton = document.querySelector('.close-button');
    const deckSelect = document.getElementById('deck-select');

    // Leaderboard elements
    const leaderboardList = document.getElementById('leaderboard-list');
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
    let highScore = localStorage.getItem('mzansiMeterHighScore') || 0;
    let allDecks = {};
    let questions = [];
    let availableQuestions = [];
    let currentQuestion = {};
    let selectedDeck = localStorage.getItem('mzansiSelectedDeck') || 'default';
    const QUESTION_TIME = 10000; // 10 seconds in milliseconds
    let questionTimer; // NEW: Timer variable
    let db; // Firebase Firestore instance

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
            allDecks = data;
            questions = allDecks[selectedDeck];
            deckSelect.value = selectedDeck;
            init();
        });


    function init() {
        highScoreStartDisplay.textContent = highScore;
        startButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', startGame);
        higherButton.addEventListener('click', () => checkAnswer('higher'));
        lowerButton.addEventListener('click', () => checkAnswer('lower'));
        shareButton.addEventListener('click', shareScore);

        // New Listeners
        settingsIcon.addEventListener('click', () => {
            console.log("Settings icon clicked!");
            settingsModal.classList.add('is-active');
        });
        closeButton.addEventListener('click', () => settingsModal.classList.remove('is-active'));
        window.addEventListener('click', (event) => {
            if (event.target == settingsModal) {
                settingsModal.classList.remove('is-active');
            }
        });
        deckSelect.addEventListener('change', handleDeckChange);
        leaderboardButton.addEventListener('click', showLeaderboard);
        backToStartButton.addEventListener('click', () => switchScreen('start'));
        submitScoreButton.addEventListener('click', submitScore);
    }

    // --- Game Flow ---
    function handleDeckChange(e) {
        selectedDeck = e.target.value;
        localStorage.setItem('mzansiSelectedDeck', selectedDeck);
        questions = allDecks[selectedDeck];
        settingsModal.style.display = 'none'; // Close modal on selection
    }

    function startGame() {
        currentScore = 0;
        updateScoreDisplay();
        // Ensure the correct question set is loaded
        questions = allDecks[selectedDeck];
        if (!questions || questions.length === 0) {
            alert('Error: Selected deck is empty or not found. Reverting to default.');
            selectedDeck = 'default';
            localStorage.setItem('mzansiSelectedDeck', selectedDeck);
            questions = allDecks[selectedDeck];
        }
        availableQuestions = [...questions];

        // Shuffle the questions to ensure variety
        for (let i = availableQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
        }

        if (availableQuestions.length > 75) {
            availableQuestions = availableQuestions.slice(0, 75);
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
                const leaderboardRef = db.collection('leaderboard');
                const snapshot = await leaderboardRef.orderBy('score', 'desc').limit(10).get();
                const lowestScoreOnLeaderboard = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].data().score : 0;

                if (currentScore > 0 && (snapshot.docs.length < 10 || currentScore > lowestScoreOnLeaderboard)) {
                    highscoreInputContainer.style.display = 'block';
                } else {
                    highscoreInputContainer.style.display = 'none';
                }
            } catch (error) {
                console.error("Error checking leaderboard:", error);
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

            const questionIndex = Math.floor(Math.random() * availableQuestions.length);
            currentQuestion = availableQuestions.splice(questionIndex, 1)[0];

            if (currentQuestion.image) {
                questionImage.src = currentQuestion.image;
                questionImageContainer.style.display = 'block';
            } else {
                questionImageContainer.style.display = 'none';
            }

            const actualValue = currentQuestion.value;
            const offset = (Math.random() * 0.4 + 0.2) * actualValue;
            let presentedNumber = Math.random() < 0.5 ? actualValue + offset : actualValue - offset;
            if (presentedNumber <= 0) presentedNumber = actualValue / 2;

            presentedValue.textContent = formatValue(presentedNumber, currentQuestion.format);
            questionText.textContent = currentQuestion.question;

            card.classList.remove('is-flipped');
            startTimer();
        }, 300); // Halfway through the 0.6s flip
    }

    // --- Answer Logic ---
    function checkAnswer(guess) {
        clearTimeout(questionTimer); // Stop the timer as soon as an answer is given

        let displayedNumberText = presentedValue.textContent.replace('R', '').replace(/,/g, '');
        const displayedNumber = parseFloat(displayedNumberText);
        const actualValue = currentQuestion.value;

        let isCorrect = (guess === 'higher' && actualValue > displayedNumber) || (guess === 'lower' && actualValue < displayedNumber);

        // Disable buttons immediately after a guess
        higherButton.disabled = true;
        lowerButton.disabled = true;

        if (isCorrect) {
            currentScore++;
            updateScoreDisplay();
            triggerConfetti();
            if (navigator.vibrate) navigator.vibrate(50);

            // Show the correct answer pop-up
            answerPopup.innerHTML = `Correct!<br>The answer was ${formatValue(currentQuestion.value, currentQuestion.format)}`;
            answerPopup.classList.add('show');

            // Wait, then hide popup and load next question
            setTimeout(() => {
                answerPopup.classList.remove('show');
                nextQuestion();
            }, 1500);

        } else {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            playWrongAnswerSound();
            endGame(`Eish, you got it wrong!`);
        }
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
        if (format === 'currency') {
            return `R${value.toFixed(2)}`;
        }
        return Math.round(value);
    }
    
    function switchScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screen}-screen`).classList.add('active');
    }

    function updateScoreDisplay() { currentScoreDisplay.textContent = currentScore; }

    function updateHighScore() {
        if (currentScore > highScore) {
            highScore = currentScore;
            localStorage.setItem('mzansiMeterHighScore', highScore);
            highScoreStartDisplay.textContent = highScore;
        }
    }

    async function showLeaderboard() {
        switchScreen('leaderboard');
        leaderboardList.innerHTML = '<li>Loading...</li>';

        if (!db) {
            leaderboardList.innerHTML = '<li>Error: Leaderboard is not available.</li>';
            return;
        }

        try {
            const leaderboardRef = db.collection('leaderboard');
            const snapshot = await leaderboardRef.orderBy('score', 'desc').limit(20).get();

            if (snapshot.empty) {
                leaderboardList.innerHTML = '<li>The leaderboard is empty! Be the first to set a score.</li>';
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
            leaderboardList.innerHTML = '<li>Could not load leaderboard. Please try again later.</li>';
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

        try {
            if (!db) throw new Error("Firestore is not initialized.");
            await db.collection('leaderboard').add(scoreData);
            highscoreInputContainer.innerHTML = '<p>Your score has been submitted!</p>';
            setTimeout(showLeaderboard, 1500); // Show updated leaderboard after a delay
        } catch (error) {
            console.error("Error submitting score:", error);
            alert("There was an error submitting your score. Please try again.");
            submitScoreButton.disabled = false;
            submitScoreButton.textContent = 'Submit';
        }
    }
    
    function getGradedTitle(score) {
        if (score <= 3) return "Certified Saffa";
        if (score <= 7) return "Local Legend";
        if (score <= 10) return "You ARE the Potjie!";
        return "National Treasure!";
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

        // Dynamically update the page's OG tags
        updateOgTags(score, title);

        const shareText = `I scored ${score} on The Mzansi Meter and they call me "${title}"! Think you can do better, boet? #MzansiMeter 🇿🇦`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'The Mzansi Meter',
                    text: shareText,
                    url: window.location.href // This URL now contains the rich OG tags
                });
            } catch (error) {
                console.error('Error sharing:', error);
                copyToClipboard(shareText); // Fallback to clipboard
            }
        } else {
            copyToClipboard(shareText); // Fallback for browsers that don't support navigator.share
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert("Score copied to clipboard! Now go and brag on social media.");
        }).catch(err => { console.error('Failed to copy: ', err); });
    }

});