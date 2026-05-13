const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

function initializeDatabase() {
    try {
        firebase.initializeApp(firebaseConfig);
        return firebase.database();
    } catch (error) {
        console.log('Firebase 초기화 실패 (개발 모드):', error);
        return null;
    }
}
