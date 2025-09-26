const fs = require('fs');
const path = require('path');

// A simple pseudo-random number generator (PRNG) using the LCG formula
function createSeededRandom(seed) {
    let state = seed;
    // LCG parameters
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;

    return function() {
        state = (a * state + c) % m;
        return state / m;
    };
}

// Fisher-Yates shuffle algorithm to shuffle an array based on a seeded PRNG
function shuffleArray(array, seededRandom) {
    let m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {
        // Pick a remaining element…
        i = Math.floor(seededRandom() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}

module.exports = async (req, res) => {
    try {
        // --- Start of seeding logic (from getDailySeed.js) ---

        // 1. Generate a daily seed from the current date (UTC)
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

        // 2. Create a seeded random number generator
        const seededRandom = createSeededRandom(seed);

        // --- End of seeding logic ---

        // 3. Read the questions file
        const questionsPath = path.join(__dirname, '..', 'questions.json');
        const questionsData = fs.readFileSync(questionsPath, 'utf8');
        const allQuestions = JSON.parse(questionsData);
        const totalQuestions = allQuestions.length;

        // 4. Generate a predictable, shuffled sequence of indices
        const allQuestionIndices = Array.from({ length: totalQuestions }, (_, i) => i);
        const shuffledIndices = shuffleArray(allQuestionIndices, seededRandom);

        // 5. Take the first 10 indices for the daily challenge
        const dailyQuestionIndices = shuffledIndices.slice(0, 10);

        // 6. Select the full question objects based on the indices
        const dailyQuestions = dailyQuestionIndices.map(index => allQuestions[index]);

        // 7. Return the JSON response with the selected questions
        res.setHeader('Content-Type', 'application/json');
        // Set cache headers - cache for 15 minutes on the client, 1 hour on the CDN
        res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=3600');
        res.status(200).json(dailyQuestions); // Return the array of objects directly

    } catch (error) {
        console.error("Error generating daily questions:", error);
        res.status(500).json({ error: 'Error generating daily questions' });
    }
};