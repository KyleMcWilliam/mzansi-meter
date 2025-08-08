document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');

    const startButton = document.getElementById('start-button');
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
    
    // NEW: Timer elements
    const timerBar = document.getElementById('timer-bar');

    // NEW: Answer reveal elements
    const revealQuestionText = document.getElementById('reveal-question-text');
    const revealCorrectAnswer = document.getElementById('reveal-correct-answer');

    const hadedaSound = document.getElementById('wrong-answer-hadeda');
    const taxiSound = document.getElementById('wrong-answer-taxi');

    // --- Game State ---
    let currentScore = 0;
    let highScore = localStorage.getItem('mzansiMeterHighScore') || 0;
    let questions = [];
    let availableQuestions = [];
    let currentQuestion = {};
    const QUESTION_TIME = 10000; // 10 seconds in milliseconds
    let questionTimer; // NEW: Timer variable

    // --- Fetch and Initialize ---
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data;
            init();
        });


    function init() {
        highScoreStartDisplay.textContent = highScore;
        startButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', startGame);
        higherButton.addEventListener('click', () => checkAnswer('higher'));
        lowerButton.addEventListener('click', () => checkAnswer('lower'));
        shareButton.addEventListener('click', shareScore);
    }

    // --- Game Flow ---
    function startGame() {
        currentScore = 0;
        updateScoreDisplay();
        availableQuestions = [...questions]; 
        switchScreen('game');
        nextQuestion();
    }

    function endGame(reason = "Wrong answer!") {
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
    }

    function nextQuestion() {
        clearTimeout(questionTimer); // NEW: Clear any previous timer

        if (availableQuestions.length === 0) {
            endGame("You answered all the questions!");
            return;
        }

        const questionIndex = Math.floor(Math.random() * availableQuestions.length);
        currentQuestion = availableQuestions.splice(questionIndex, 1)[0];

        // NEW: Handle image display
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

        card.classList.remove('correct-answer');
        void card.offsetWidth;
        card.classList.add('correct-answer');

        startTimer(); // NEW: Start the timer for the new question
    }

    // --- Answer Logic ---
    function checkAnswer(guess) {
        clearTimeout(questionTimer); // NEW: Stop the timer as soon as an answer is given
        
        let displayedNumberText = presentedValue.textContent.replace('R', '');
        const displayedNumber = parseFloat(displayedNumberText);
        const actualValue = currentQuestion.value;
        
        let isCorrect = (guess === 'higher' && actualValue > displayedNumber) || (guess === 'lower' && actualValue < displayedNumber);

        if (isCorrect) {
            currentScore++;
            updateScoreDisplay();
            // Add a slight delay for satisfaction before the next question
            setTimeout(nextQuestion, 300);
        } else {
            gameContainer.classList.add('wrong-answer');
            setTimeout(() => {
                gameContainer.classList.remove('wrong-answer');
                endGame();
            }, 500);
        }
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

    async function shareScore() {
        const title = getGradedTitle(currentScore);
        const text = `My Mzansi Meter Score: ${currentScore}!\nThey call me a "${title}". Eish!\n\nThink you can do better, boet? #MzansiMeter 🇿🇦`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'The Mzansi Meter', text: text, url: window.location.href });
            } catch (error) { console.error('Error sharing:', error); copyToClipboard(text); }
        } else {
            copyToClipboard(text);
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert("Score copied to clipboard! Now go and brag on social media.");
        }).catch(err => { console.error('Failed to copy: ', err); });
    }

});