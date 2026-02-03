const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let players = {};

/* SEND GAME STATE */
setInterval(() => {
    io.emit("tick", { players });
}, 33);

io.on("connection", socket => {
    console.log("Player connected:", socket.id);

    players[socket.id] = {
        x: 0,
        y: 0
    };

    socket.on("update", data => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
        }
    });

    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        delete players[socket.id];
    });
});

http.listen(process.env.PORT || 3000, () =>
    console.log("Server Live")
);
