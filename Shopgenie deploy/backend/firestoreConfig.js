const admin = require("firebase-admin");
const serviceAccount = require("./shopgenie.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();

module.exports = firestore;
