// app game
const game = require('./game');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('../client'));

io.on('connection', (socket) => {
  var name = null;

  socket.on('state', () => {
    socket.emit('state', game.current());
  });

  socket.on('join', (player) => {
    name = player;
    game.addPlayer(player);
    socket.emit('state', game.current());
  });

  socket.on('ready', (player) => {
    game.setReady(player);
    socket.emit('state', game.current());
  });

  socket.on('disconnect', () => {
    // game.removePlayer(name);
  });
});

// end routing

const PORT = 3000;
http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
});
