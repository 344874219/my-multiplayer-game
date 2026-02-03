const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const WORLD_RADIUS = 1500;

let players = {};
let mobs = [];
let waveCount = 0;
let waveTimer = 3;

// ---------- MOB HELPERS ----------
function spawnMob(isBoss) {
    const a = Math.random() * Math.PI * 2;
    const d = WORLD_RADIUS - 100;
    mobs.push({
        id: Math.random().toString(36).slice(2),
        x: Math.cos(a) * d,
        y: Math.sin(a) * d,
        radius: isBoss ? 220 : 25,
        color: isBoss ? "#000" : "#c62828",
        hp: isBoss ? 50000000 : 10000,
        maxHp: isBoss ? 50000000 : 10000,
        speed: isBoss ? 0.8 : 3.5,
        isBoss
    });
}

function spawnWave() {
    waveCount++;
    if (waveCount % 10 === 0) {
        spawnMob(true);
    } else {
        for (let i = 0; i < 5 + waveCount * 2; i++) {
            spawnMob(false);
        }
    }
}

// ---------- GAME LOOP ----------
setInterval(() => {
    // Wave timer
    waveTimer -= 1 / 30;
    if (waveTimer <= 0) {
        spawnWave();
        waveTimer = 3;
    }

    // Move mobs toward closest player
    for (const mob of mobs) {
        let closest = null;
        let closestDist = Infinity;

        for (const id in players) {
            const p = players[id];
            const d = Math.hypot(p.x - mob.x, p.y - mob.y);
            if (d < closestDist) {
                closestDist = d;
                closest = p;
            }
        }

        if (closest) {
            const dx = closest.x - mob.x;
            const dy = closest.y - mob.y;
            const d = Math.hypot(dx, dy) || 1;
            mob.x += (dx / d) * mob.speed;
            mob.y += (dy / d) * mob.speed;
        }
    }

    io.emit("state", {
        players,
        mobs,
        waveCount,
        waveTimer
    });
}, 33);

// ---------- SOCKET ----------
io.on("connection", socket => {
    console.log("Player connected:", socket.id);

    players[socket.id] = {
        x: 0,
        y: 0,
        hp: 5000,
        maxHp: 5000,
        radius: 35
    };

    socket.on("update", data => {
        if (!players[socket.id]) return;
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
    });

    socket.on("damageMob", ({ id, dmg }) => {
        const mob = mobs.find(m => m.id === id);
        if (!mob) return;
        mob.hp -= dmg;
        if (mob.hp <= 0) {
            mobs = mobs.filter(m => m.id !== id);
        }
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        console.log("Player disconnected:", socket.id);
    });
});

http.listen(process.env.PORT || 3000, () =>
    console.log("Server live")
);
