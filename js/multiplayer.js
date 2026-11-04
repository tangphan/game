const MAX_CHAT_LENGTH = 300;

export class MultiplayerClient {
  constructor(onEvent) {
    this.onEvent = onEvent;
    this.socket = null;
    this.name = '';
    this.roomCode = '';
    this.playerId = '';
    this.lastPositionSentAt = 0;
  }

  get connected() {
    return this.socket?.readyState === WebSocket.OPEN && Boolean(this.roomCode);
  }

  connect(name, roomCode = '') {
    if (this.connected) {
      return Promise.resolve({ roomCode: this.roomCode });
    }

    this.name = name.trim().slice(0, 18);
    if (!this.name) {
      return Promise.reject(new Error('Hãy nhập tên nhân vật trước khi vào phòng.'));
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    this.socket = socket;

    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = (message) => {
        if (settled) return;
        settled = true;
        reject(new Error(message));
        if (socket.readyState < WebSocket.CLOSING) socket.close();
      };

      socket.addEventListener('open', () => {
        this.send({
          type: roomCode ? 'join-room' : 'create-room',
          name: this.name,
          roomCode: roomCode.trim().toUpperCase()
        });
      }, { once: true });

      socket.addEventListener('message', (event) => {
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          fail('Máy chủ gửi dữ liệu không hợp lệ.');
          this.onEvent({ type: 'error', message: 'Dữ liệu phòng chơi không hợp lệ.' });
          return;
        }

        if (message.type === 'error') {
          fail(message.message || 'Không thể tham gia phòng.');
          this.onEvent(message);
          return;
        }

        if (message.type === 'room-ready') {
          settled = true;
          this.roomCode = message.roomCode;
          this.playerId = message.playerId;
          resolve({ roomCode: this.roomCode, spawn: message.spawn });
        }
        this.onEvent(message);
      });

      socket.addEventListener('error', () => {
        fail('Không thể kết nối máy chủ. Hãy kiểm tra địa chỉ và trạng thái máy chủ.');
      });

      socket.addEventListener('close', () => {
        if (!settled) fail('Kết nối đến máy chủ đã bị đóng.');
        if (this.socket === socket) {
          const hadRoom = Boolean(this.roomCode);
          this.roomCode = '';
          this.playerId = '';
          this.onEvent({ type: 'disconnected', hadRoom });
        }
      });
    });
  }

  sendPosition(position, rotationY, riding = false, now = performance.now()) {
    if (!this.connected || now - this.lastPositionSentAt < 100) return;
    this.lastPositionSentAt = now;
    this.send({
      type: 'player-update',
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
        rotationY
      },
      riding
    });
  }

  sendChat(text) {
    const message = text.trim().slice(0, MAX_CHAT_LENGTH);
    if (!message || !this.connected) return false;
    this.send({ type: 'chat', text: message });
    return true;
  }

  close() {
    this.socket?.close();
  }

  send(message) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }
}
