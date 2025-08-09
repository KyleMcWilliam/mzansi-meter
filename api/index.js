const functions = require('firebase-functions');
const express = require('express');
const generateImageHandler = require('./generate-image.js');
const getDailySeedHandler = require('./getDailySeed.js');

const app = express();

// Route requests to the appropriate handlers
app.get('/generate-image', generateImageHandler);
app.get('/getDailySeed', getDailySeedHandler);


// Expose the Express app as a single Cloud Function.
// This function will be named 'api' because the file is index.js
// and it's the only export.
exports.api = functions.https.onRequest(app);
