# Migration Instructions
To complete the migration of questions to Firestore, please follow these steps on your local machine where you have `firebase-tools` installed and are authenticated.

## Prerequisites
- Node.js installed
- `firebase-tools` installed globally (`npm install -g firebase-tools`)
- You are logged in to Firebase (`firebase login`)

## Steps

1. **Deploy Firestore Rules**
   Ensure the updated `firestore.rules` are deployed to allow write access to the `questions` collection.
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Run the Migration Script**
   Navigate to the `api` directory and run the migration script. The script uses the Firebase Admin SDK or Client SDK to upload `questions.json` to the `questions` collection.

   *Note: Since the script was moved to `api/migrate.js` in the sandbox, ensure you have the correct file. You can create a new file named `migrate.js` with the following content in your project root:*

   ```javascript
   const { initializeApp } = require("firebase/app");
   const { getFirestore, collection, addDoc, getDocs, deleteDoc } = require("firebase/firestore");
   const fs = require('fs');

   // Initialize Firebase (use your web app config)
   const firebaseConfig = {
       apiKey: "AIzaSyAj6VSGZxEZhK1cxlwLl6dkOlWN2MwWpqE",
       authDomain: "mzanzi-meter.firebaseapp.com",
       projectId: "mzanzi-meter",
       storageBucket: "mzanzi-meter.firebasestorage.app",
       messagingSenderId: "133492065727",
       appId: "1:133492065727:web:98817a2a3e7e3426734d0a",
       measurementId: "G-HS5RX6953L"
   };

   const app = initializeApp(firebaseConfig);
   const db = getFirestore(app);

   async function migrate() {
       console.log("Starting migration...");

       // Read questions
       const rawData = fs.readFileSync('questions.json', 'utf8');
       const questions = JSON.parse(rawData);

       console.log(`Found ${questions.length} questions to upload.`);

       const questionsCollection = collection(db, 'questions');

       // Check if collection is not empty
       const snapshot = await getDocs(questionsCollection);
       if (!snapshot.empty) {
           console.log(`Collection already has ${snapshot.size} documents. Skipping migration to avoid duplicates.`);
           // Uncomment below to clear and re-upload:
           // const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
           // await Promise.all(deletePromises);
           // console.log("Cleared existing documents.");
           return;
       }

       let count = 0;
       for (const q of questions) {
           try {
               await addDoc(questionsCollection, q);
               count++;
               if (count % 10 === 0) console.log(`Uploaded ${count} questions...`);
           } catch (e) {
               console.error("Error uploading question:", q, e);
           }
       }

       console.log("Migration complete!");
   }

   migrate().catch(console.error);
   ```

3. **Install Dependencies**
   In the same directory where you created `migrate.js`, install the firebase package:
   ```bash
   npm install firebase
   ```

4. **Execute**
   ```bash
   node migrate.js
   ```

5. **Secure Firestore Rules**
   Once migration is done, it is recommended to lock down the `questions` collection to read-only for public users. Update `firestore.rules` locally and deploy again:
   ```
   match /questions/{docId} {
      allow read: if true;
      allow write: if false; // Lock writes after migration
   }
   ```
