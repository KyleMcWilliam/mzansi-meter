const { createCanvas } = require('canvas');

module.exports = async (req, res) => {
    try {
        // Get score and title from query parameters, providing defaults
        const { score = '0', title = 'Certified Saffa' } = req.query;
        const decodedTitle = decodeURIComponent(title);

        // Image dimensions
        const width = 1200;
        const height = 630;

        // Create a canvas
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');

        // --- Draw Background ---
        const gradient = context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#007A4D'); // Mzansi Green
        gradient.addColorStop(1, '#262626'); // Dark Color
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        // --- Draw Text ---
        context.fillStyle = '#FFFFFF';
        context.textAlign = 'center';

        // Draw the main title (e.g., "I scored 15 on...")
        context.font = '60px sans-serif';
        context.fillText('I scored', width / 2, 150);

        // Draw the Score
        context.font = 'bold 250px sans-serif';
        context.fillText(score, width / 2, 380);

        // Draw the Graded Title (e.g., "Local Legend")
        context.font = 'italic 70px sans-serif';
        context.fillStyle = '#FFB612'; // Mzansi Gold
        context.fillText(`"${decodedTitle}"`, width / 2, 500);

        // --- Send Image ---
        const buffer = canvas.toBuffer('image/png');
        res.setHeader('Content-Type', 'image/png');
        // Set cache headers for Vercel's edge network
        res.setHeader('Cache-Control', 's-maxage=31536000, stale-while-revalidate');
        res.send(buffer);

    } catch (error) {
        console.error("Error generating image:", error);
        // Return a 500 error if something goes wrong
        res.status(500).send('Error generating image');
    }
};
