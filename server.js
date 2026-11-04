const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { WebSocketServer, WebSocket } = require('ws');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const MAX_PLAYERS_PER_ROOM = 12;
const MAX_ACTIVE_ROOMS = 500;
const MAX_NAME_LENGTH = 18;
const MAX_CHAT_LENGTH = 300;
const rooms = new Map();
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  if (pathname === '/ws') {
    response.writeHead(426, { Upgrade: 'websocket' });
    response.end('WebSocket upgrade required');
    return;
  }

  const requestedPath = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = path.resolve(ROOT, requestedPath);
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache'
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    console.error('Failed to serve game file:', error);
    response.writeHead(500);
    response.end('Internal server error');
  }
});

const webSocketServer = new WebSocketServer({
  noServer: true,
  maxPayload: 16 * 1024
});

server.on('upgrade', (request, socket, head) => {
  let requestUrl;
  try {
    requestUrl = new URL(request.url, `http://${request.headers.host}`);
  } catch {
    socket.destroy();
    return;
  }

  const origin = request.headers.origin;
  let originHost;
  try {
    originHost = origin ? new URL(origin).host : request.headers.host;
  } catch {
    originHost = '';
  }
  if (requestUrl.pathname !== '/ws' || originHost !== request.headers.host) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }

  webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
    webSocketServer.emit('connection', webSocket);
  });
});

webSocketServer.on('connection', (socket) => {
  socket.playerId = crypto.randomUUID();
  socket.roomCode = '';
  socket.playerName = '';
  socket.lastChatAt = 0;
  socket.lastPositionAt = 0;

  socket.on('message', (buffer) => {
    let message;
    try {
      message = JSON.parse(buffer.toString());
    } catch {
      sendError(socket, 'Yêu cầu không hợp lệ.');
      return;
    }
    if (!message || typeof message !== 'object' || Array.isArray(message)) {
      sendError(socket, 'Yêu cầu không hợp lệ.');
      return;
    }

    if (!socket.roomCode) {
      joinRoom(socket, message);
      return;
    }

    if (message.type === 'player-update') {
      relayPosition(socket, message);
    } else if (message.type === 'chat') {
      relayChat(socket, message);
    } else {
      sendError(socket, 'Loại yêu cầu không được hỗ trợ.');
    }
  });

  socket.on('close', () => {
    leaveRoom(socket);
  });

  socket.on('error', (error) => {
    console.error('WebSocket client error:', error.message);
  });
});

function joinRoom(socket, message) {
  if (message.type !== 'create-room' && message.type !== 'join-room') {
    sendError(socket, 'Hãy tạo phòng mới hoặc nhập mã phòng.');
    return;
  }

  const name = typeof message.name === 'string' ? message.name.trim().slice(0, MAX_NAME_LENGTH) : '';
  if (!name) {
    sendError(socket, 'Tên nhân vật không được để trống.');
    return;
  }

  let roomCode;
  if (message.type === 'create-room') {
    if (rooms.size >= MAX_ACTIVE_ROOMS) {
      sendError(socket, 'Máy chủ đang có quá nhiều phòng. Hãy thử lại sau.');
      return;
    }
    roomCode = createRoomCode();
    rooms.set(roomCode, new Map());
  } else {
    roomCode = typeof message.roomCode === 'string' ? message.roomCode.trim().toUpperCase() : '';
    if (!/^[A-Z0-9]{6}$/.test(roomCode) || !rooms.has(roomCode)) {
      sendError(socket, 'Không tìm thấy phòng. Hãy kiểm tra lại mã mời.');
      return;
    }
  }

  const room = rooms.get(roomCode);
  if (room.size >= MAX_PLAYERS_PER_ROOM) {
    sendError(socket, 'Phòng đã đủ 12 người chơi.');
    return;
  }

  const existingPlayers = Array.from(room.values());
  const spawnAngle = room.size * Math.PI * 2 / MAX_PLAYERS_PER_ROOM;
  const spawn = {
    x: 35 + Math.cos(spawnAngle) * Math.min(5 + room.size, 14),
    z: -20 + Math.sin(spawnAngle) * Math.min(5 + room.size, 14)
  };
  socket.playerName = name;
  socket.roomCode = roomCode;
  room.set(socket.playerId, {
    id: socket.playerId,
    name,
    riding: false,
    position: { ...spawn, y: 0, rotationY: 0 }
  });

  send(socket, {
    type: 'room-ready',
    roomCode,
    playerId: socket.playerId,
    spawn,
    players: existingPlayers
  });

  broadcast(roomCode, {
    type: 'player-joined',
    player: room.get(socket.playerId)
  }, socket);
}

function relayPosition(socket, message) {
  const position = message.position;
  if (!position || !['x', 'y', 'z', 'rotationY'].every((key) => Number.isFinite(position[key]))) {
    sendError(socket, 'Vị trí nhân vật không hợp lệ.');
    return;
  }

  const now = Date.now();
  if (now - socket.lastPositionAt < 80) return;
  socket.lastPositionAt = now;

  const player = rooms.get(socket.roomCode)?.get(socket.playerId);
  if (!player) return;
  player.position = {
    x: clamp(position.x, -200, 200),
    y: clamp(position.y, 0, 10),
    z: clamp(position.z, -200, 200),
    rotationY: clamp(position.rotationY, -Math.PI * 4, Math.PI * 4)
  };
  player.riding = message.riding === true;
  broadcast(socket.roomCode, {
    type: 'player-update',
    player
  }, socket);
}

function relayChat(socket, message) {
  const text = typeof message.text === 'string' ? message.text.trim().slice(0, MAX_CHAT_LENGTH) : '';
  if (!text) return;

  const now = Date.now();
  if (now - socket.lastChatAt < 500) {
    sendError(socket, 'Bạn đang gửi tin nhắn quá nhanh.');
    return;
  }
  socket.lastChatAt = now;

  broadcast(socket.roomCode, {
    type: 'chat',
    id: socket.playerId,
    name: socket.playerName,
    text,
    timestamp: now
  });
}

function leaveRoom(socket) {
  if (!socket.roomCode) return;
  const roomCode = socket.roomCode;
  const room = rooms.get(roomCode);
  room?.delete(socket.playerId);
  socket.roomCode = '';

  if (room?.size) {
    broadcast(roomCode, { type: 'player-left', playerId: socket.playerId });
  } else {
    rooms.delete(roomCode);
  }
}

function createRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    const bytes = crypto.randomBytes(6);
    code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  } while (rooms.has(code));
  return code;
}

function broadcast(roomCode, message, exceptSocket) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const serialized = JSON.stringify(message);
  for (const client of webSocketServer.clients) {
    if (client !== exceptSocket && client.readyState === WebSocket.OPEN && client.roomCode === roomCode) {
      client.send(serialized);
    }
  }
}

function send(socket, message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function sendError(socket, message) {
  send(socket, { type: 'error', message });
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

server.listen(PORT, HOST, () => {
  console.log(`Yen Thanh 3D server listening on http://${HOST}:${PORT}`);
});
