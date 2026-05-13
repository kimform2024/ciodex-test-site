const admin = require('firebase-admin');

function getServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }

    if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
    ) {
        return {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        };
    }

    return null;
}

function getDatabase() {
    if (!admin.apps.length) {
        const serviceAccount = getServiceAccount();
        const databaseURL = process.env.FIREBASE_DATABASE_URL;

        if (!serviceAccount || !databaseURL) {
            throw new Error('Firebase Admin 환경변수가 설정되지 않았습니다.');
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL
        });
    }

    return admin.database();
}

module.exports = { getDatabase };
