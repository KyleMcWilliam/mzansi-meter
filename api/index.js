const functions = require('firebase-functions');
const express = require('express');
// const generateImageHandler = require('./generate-image.js'); // Temporarily disabled for debugging
// const getDailyQuestionsHandler = require('./getDailyQuestions.js'); // Moved to client-side

const app = express();
const apiRouter = express.Router();

// Setup the routes for the API
// apiRouter.get('/getDailyQuestions', getDailyQuestionsHandler);
// apiRouter.get('/generate-image', generateImageHandler); // Temporarily disabled for debugging

// Mount the router under the /api path
app.use('/api', apiRouter);

// Expose the Express app as a single Cloud Function named "api".
exports.api = functions.https.onRequest(app);
