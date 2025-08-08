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
    const answerPopup = document.getElementById('answer-popup');
    
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

        // Ensure buttons are enabled for the new question
        higherButton.disabled = false;
        lowerButton.disabled = false;

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

            // Show the correct answer pop-up
            answerPopup.innerHTML = `Correct!<br>The answer was ${formatValue(currentQuestion.value, currentQuestion.format)}`;
            answerPopup.classList.add('show');

            // Wait, then hide popup and load next question
            setTimeout(() => {
                answerPopup.classList.remove('show');
                // Buttons are re-enabled in nextQuestion()
                nextQuestion();
            }, 1500); // 1.5 second delay

        } else {
            // Vibrate and play sound on wrong answer
            gameContainer.classList.add('wrong-answer');
            playWrongAnswerSound();

            setTimeout(() => {
                gameContainer.classList.remove('wrong-answer');
                // Pass the correct reason for ending the game
                endGame(`Eish, you got it wrong!`);
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