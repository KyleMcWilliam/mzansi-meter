import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";
import fs from 'fs';

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadQuestions() {
    console.log("Reading questions.json...");
    const rawData = fs.readFileSync('questions.json');
    const questions = JSON.parse(rawData);
    console.log(`Found ${questions.length} questions to upload.`);

    const collectionRef = collection(db, "questions");

    // 1. Delete existing questions
    console.log("Fetching existing questions to delete...");
    const snapshot = await getDocs(collectionRef);
    if (snapshot.size > 0) {
        console.log(`Deleting ${snapshot.size} existing documents...`);
        const batchSize = 400; // Firestore batch limit is 500
        let batch = writeBatch(db);
        let count = 0;
        let totalDeleted = 0;

        for (const docSnapshot of snapshot.docs) {
            batch.delete(doc(db, "questions", docSnapshot.id));
            count++;
            if (count >= batchSize) {
                await batch.commit();
                totalDeleted += count;
                console.log(`Deleted ${totalDeleted} documents...`);
                batch = writeBatch(db); // new batch
                count = 0;
            }
        }
        if (count > 0) {
            await batch.commit();
            totalDeleted += count;
        }
        console.log(`Finished deleting ${totalDeleted} documents.`);
    } else {
        console.log("No existing questions found.");
    }

    // 2. Upload new questions
    console.log("Uploading new questions...");
    const batchSize = 400;
    let batch = writeBatch(db);
    let count = 0;
    let totalUploaded = 0;

    for (const question of questions) {
        const newDocRef = doc(collectionRef); // Auto-ID
        batch.set(newDocRef, question);
        count++;

        if (count >= batchSize) {
            await batch.commit();
            totalUploaded += count;
            console.log(`Uploaded ${totalUploaded} questions...`);
            batch = writeBatch(db);
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
        totalUploaded += count;
    }
    console.log(`Successfully uploaded ${totalUploaded} questions!`);
}

uploadQuestions().catch(console.error);
