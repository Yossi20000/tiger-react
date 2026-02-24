import { io } from 'socket.io-client';

// הכתובת המעודכנת של השרת שלך ב-Render
const URL = 'https://tiger-server-live.onrender.com'; 

const socket = io(URL, {
    transports: ['websocket'], // חיבור יציב יותר לסביבת ענן
    reconnection: true,        // ניסיון חיבור מחדש אוטומטי
    reconnectionAttempts: 5    
});

// בדיקת חיבור בלוגים של הדפדפן
socket.on('connect', () => {
    console.log('Connected successfully to Render server');
});

export default socket;