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
        const TOTAL_QUESTIONS = 101; // As determined from questions.json

        // 1. Generate a daily seed from the current date (UTC)
        const today = new Date();
        const year = today.getUTCFullYear();
        const month = (today.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = today.getUTCDate().toString().padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        // Create a numeric seed from the date string
        let seed = 0;
        for (let i = 0; i < dateString.length; i++) {
            seed = (seed * 31 + dateString.charCodeAt(i)) & 0xFFFFFFFF; // Keep it a 32-bit integer
        }

        // 2. Create a seeded random number generator
        const seededRandom = createSeededRandom(seed);

        // 3. Generate a predictable sequence of numbers
        const allQuestionIndices = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i);

        // 4. Shuffle the array of indices using the seeded PRNG
        const shuffledIndices = shuffleArray(allQuestionIndices, seededRandom);

        // 5. Take the first 10 indices for the daily challenge
        const dailyQuestions = shuffledIndices.slice(0, 10);

        // 6. Return the JSON response
        res.setHeader('Content-Type', 'application/json');
        // Set cache headers - cache for 15 minutes on the client, 1 hour on the CDN
        res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=3600');
        res.status(200).json({ dailyQuestions });

    } catch (error) {
        console.error("Error generating daily seed:", error);
        res.status(500).json({ error: 'Error generating daily seed' });
    }
};
