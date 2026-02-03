const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static('public'));

let players = {};
let mobs = [];
let waveCount = 1;
let waveTimer = 3; // 3 seconds per wave logic

// Shared Spawning Logic
function spawnMob(isBoss) {
    let angle = Math.random() * Math.PI * 2;
    let dist = 1400;
    mobs.push({
        id: Math.random(),
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        radius: isBoss ? 200 : 25,
        hp: isBoss ? 1000000 : 10000,
        maxHp: isBoss ? 1000000 : 10000,
        speed: isBoss ? 0.8 : 3.2,
        isBoss: isBoss
    });
}

// Global Game Loop (Runs on Server)
setInterval(() => {
    // Wave Countdown
    waveTimer -= 0.033;
    if (waveTimer <= 0) {
        waveCount++;
        waveTimer = 3;
        if (waveCount % 10 === 0) spawnMob(true);
        else for(let i=0; i<5+(waveCount*2); i++) spawnMob(false);
    }

    // Mob AI: Move toward the nearest player
    mobs.forEach(m => {
        let nearest = null;
        let minDist = Infinity;
        for (let id in players) {
            let d = Math.hypot(players[id].x - m.x, players[id].y - m.y);
            if (d < minDist) { minDist = d; nearest = players[id]; }
        }
        if (nearest) {
            let angle = Math.atan2(nearest.y - m.y, nearest.x - m.x);
            m.x += Math.cos(angle) * m.speed;
            m.y += Math.sin(angle) * m.speed;
        }
    });

    io.emit('tick', { players, mobs, waveCount, waveTimer: Math.ceil(waveTimer) });
}, 33);

io.on('connection', (socket) => {
    players[socket.id] = { x: 0, y: 0, hp: 5000, petalAngle: 0, petalDist: 40 };

    socket.on('update', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].petalAngle = data.petalAngle;
            players[socket.id].petalDist = data.petalDist;
        }
    });

    socket.on('hitMob', (data) => {
        let mob = mobs.find(m => m.id === data.mobId);
        if (mob) {
            mob.hp -= 100000; // Your 100k damage
            if (mob.hp <= 0) mobs = mobs.filter(m => m.id !== data.mobId);
        }
    });

    socket.on('disconnect', () => delete players[socket.id]);
});

http.listen(process.env.PORT || 3000);
