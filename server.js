const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

let players = {};
let mobs = [];

// Sync everything 30 times a second
setInterval(() => {
    io.emit('tick', { players, mobs });
}, 33);

io.on('connection', (socket) => {
    players[socket.id] = { x: 0, y: 0, hp: 1000 };
    socket.on('update', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
        }
    });
    socket.on('disconnect', () => delete players[socket.id]);
});

http.listen(process.env.PORT || 3000, () => console.log('Server Live'));
