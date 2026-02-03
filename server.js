const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const path = require('path');

app.use(express.static('public'));

let players = {};
let mobs = [];

// Sync everything 30 times a second
setInterval(() => {
    io.emit('tick', { players, mobs });
}, 33);

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    players[socket.id] = { x: 0, y: 0, hp: 1000 };

    socket.on('update', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('Server Live on port ' + PORT));
