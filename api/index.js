const functions = require('firebase-functions');
const express = require('express');
const generateImageHandler = require('./generate-image.js');
const getDailySeedHandler = require('./getDailySeed.js');

const app = express();
const apiRouter = express.Router();

// Setup the routes for the API
apiRouter.get('/getDailySeed', getDailySeedHandler);
apiRouter.get('/generate-image', generateImageHandler);

// Mount the router under the /api path
app.use('/api', apiRouter);

// Expose the Express app as a single Cloud Function named "api".
exports.api = functions.https.onRequest(app);
