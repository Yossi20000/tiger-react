const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let gameState = {
    teams: [],
    timer: { minutes: 20, seconds: 0, isRunning: false }
};

// לוגיקת הטיימר
setInterval(() => {
    if (gameState.timer.isRunning) {
        if (gameState.timer.seconds > 0) {
            gameState.timer.seconds--;
        } else if (gameState.timer.minutes > 0) {
            gameState.timer.minutes--;
            gameState.timer.seconds = 59;
        } else {
            gameState.timer.isRunning = false;
        }
        io.emit('gameState', gameState);
    }
}, 1000);

io.on('connection', (socket) => {
    socket.emit('gameState', gameState);
    socket.on('updateState', (newState) => {
        gameState = newState;
        io.emit('gameState', gameState);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});