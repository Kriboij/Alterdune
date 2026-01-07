import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';

//#region SETUP

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = 8080;

app.use(express.json());
app.use(express.static('public'));

//#endregion


//#region ESTADO EN MEMORIA

const players = new Map();
const playerMatches = new Map();
const matchmakingQueue = [];
const matches = new Map();

/*
match = {
  id,
  state: 'LOBBY' | 'PLAYING' | 'ENDED',
  players: [
    { nickname, socketId, color, ready, connected }
  ]
}
*/

//#endregion


//#region UTILIDADES

function endMatch(matchId, reason) {
  const match = matches.get(matchId);
  if (!match) return;

  console.log('[MATCH END]', {
    matchId,
    reason,
    players: match.players.map(p => p.nickname)
  });

  match.state = 'ENDED';

  io.to(matchId).emit('match:end', { reason });

  match.players.forEach(p => {
    console.log('[MATCH CLEANUP]', p.nickname);
    playerMatches.delete(p.nickname);
    const s = io.sockets.sockets.get(p.socketId);
    if (s) s.leave(matchId);
  });

  matches.delete(matchId);
}

//#endregion


//#region SOCKET.IO

io.on('connection', socket => {

  console.log('[WS CONNECT]', {
    socketId: socket.id
  });

  socket.on('player:sync', ({ playerId, position }) => {
    if (!socket.matchId) return;

    socket.to(socket.matchId).emit('player:sync', {
      playerId,
      position
    });
  });


  socket.onAny((event, data) => {
    console.log('[WS EVENT]', {
      socketId: socket.id,
      event,
      data
    });
  });


  socket.on('match:join', ({ matchId, nickname }) => {
    console.log('[JOIN TRY]', {
      socketId: socket.id,
      nickname,
      matchId
    });

    const match = matches.get(matchId);
    if (!match) {
      console.log('[JOIN FAIL] match no existe', matchId);
      return;
    }

    socket.matchId = matchId;
    socket.nickname = nickname;
    socket.join(matchId);

    const existing = match.players.find(p => p.nickname === nickname);

    if (existing) {
      console.log('[JOIN RECONNECT]', nickname);
      existing.socketId = socket.id;
      existing.connected = true;
    } else {
      console.log('[JOIN NEW PLAYER]', nickname);
      match.players.push({
        nickname,
        socketId: socket.id,
        color: 'duende',
        ready: false,
        connected: true
      });
    }

    console.log('[MATCH STATE]', matchId, {
      state: match.state,
      players: match.players.map(p => ({
        nick: p.nickname,
        socketId: p.socketId,
        ready: p.ready,
        connected: p.connected
      }))
    });

    io.to(matchId).emit('match:update', match);
  });


  socket.on('match:selectColor', ({ color }) => {
    const match = matches.get(socket.matchId);
    if (!match || match.state !== 'LOBBY') return;

    const player = match.players.find(p => p.socketId === socket.id);
    if (!player) return;

    console.log('[COLOR SELECT]', {
      nickname: player.nickname,
      color
    });

    player.color = color;
    io.to(match.id).emit('match:update', match);
  });


  socket.on('match:ready', () => {
    const match = matches.get(socket.matchId);
    if (!match || match.state !== 'LOBBY') return;

    const player = match.players.find(p => p.socketId === socket.id);
    if (!player) return;

    player.ready = true;

    console.log('[READY]', {
      nickname: player.nickname
    });

    if (
      match.players.length === 2 &&
      match.players.every(p => p.ready)
    ) {
      match.state = 'PLAYING';
      console.log('[MATCH START]', match.id);
    }

    io.to(match.id).emit('match:update', match);
  });


  socket.on('player:move', ({ dir }) => {
    if (!socket.matchId) {
      console.log('[MOVE DROP] socket sin matchId', socket.id);
      return;
    }

    console.log('[MOVE RX]', {
      nickname: socket.nickname,
      dir,
      matchId: socket.matchId
    });

    socket.to(socket.matchId).emit('player:move', { dir });
  });


  socket.on('player:respawn', ({ playerId }) => {
    if (!socket.matchId) return;

    console.log('[RESPAWN]', {
      from: socket.nickname,
      playerId
    });

    socket.to(socket.matchId).emit('player:respawn', { playerId });
  });


  socket.on('disconnect', () => {
    console.log('[WS DISCONNECT]', {
      socketId: socket.id,
      nickname: socket.nickname,
      matchId: socket.matchId
    });

    const matchId = socket.matchId;
    if (!matchId) return;

    const match = matches.get(matchId);
    if (!match) return;

    const player = match.players.find(p => p.socketId === socket.id);
    if (!player) return;

    player.connected = false;

    console.log('[PLAYER DISCONNECTED]', {
      nickname: player.nickname,
      matchId
    });

    endMatch(matchId, 'disconnect')

    io.to(matchId).emit('player:disconnected', {
      nickname: player.nickname
    });
  });

});

//#endregion


//#region REST MATCHMAKING

app.post('/queue', (req, res) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({ error: 'nickname requerido' });
  }

  console.log('[QUEUE]', nickname);

  if (playerMatches.has(nickname)) {
    return res.json({
      matchFound: true,
      matchId: playerMatches.get(nickname)
    });
  }

  if (!matchmakingQueue.includes(nickname)) {
    matchmakingQueue.push(nickname);
  }

  if (matchmakingQueue.length >= 2) {
    const p1 = matchmakingQueue.shift();
    const p2 = matchmakingQueue.shift();

    const matchId = crypto.randomUUID();

    matches.set(matchId, {
      id: matchId,
      state: 'LOBBY',
      players: []
    });

    playerMatches.set(p1, matchId);
    playerMatches.set(p2, matchId);

    console.log('[MATCH CREATED]', matchId, p1, p2);
  }

  res.json({ matchFound: false });
});

//#endregion


//#region REST PLAYERS

app.post('/players', (req, res) => {
  const { nickname } = req.body;
  if (!nickname) {
    return res.status(400).json({ error: 'nickname requerido' });
  }

  if (players.has(nickname)) {
    return res.status(409).json({ error: 'Jugador ya existe' });
  }

  const player = {
    nickname,
    wins: 0,
    losses: 0,
    createdAt: new Date().toISOString()
  };


  players.set(nickname, player);

  console.log('[LOGIN]', nickname);

  res.status(201).json(player);
});

app.get('/players/:nickname', (req, res) => {
  const player = players.get(req.params.nickname);
  if (!player) return res.status(404).json({ error: 'No existe' });
  res.json(player);
});



app.put('/players/:nickname', (req, res) => {
  const player = players.get(req.params.nickname);
  if (!player) {
    return res.status(404).json({ error: 'Jugador no encontrado' });
  }

  const { wins, losses } = req.body;

  if (typeof wins === 'number') {
    player.wins += wins;
  }

  if (typeof losses === 'number') {
    player.losses += losses;
  }


  console.log('[UPDATE SCORE]', {
    nickname: player.nickname,
    maxScore: player.maxScore
  });

  res.json(player);
});


app.delete('/players/:nickname', (req, res) => {
  players.delete(req.params.nickname);
  console.log('[LOGOUT]', req.params.nickname);
  res.sendStatus(204);
});

//#endregion


//#region START SERVER

httpServer.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});

//#endregion
