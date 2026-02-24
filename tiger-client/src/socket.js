import { io } from 'socket.io-client';

// הכתובת שקיבלת מרנדר
const URL = 'https://tiger-react.onrender.com';

const socket = io(URL, {
    transports: ['websocket'], // מבטיח חיבור יציב יותר בענן
});

export default socket;