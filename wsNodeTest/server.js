const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log('WS emulator running on ws://localhost:8080');

let running = false;
let baudRate = 500000;

const frames = [
  { id: 0x100, dlc: 8, data: new Array(8).fill(0) },
  { id: 0x200, dlc: 8, data: new Array(8).fill(0) },
  { id: 0x300, dlc: 4, data: new Array(4).fill(0) },
  { id: 0x400, dlc: 2, data: new Array(2).fill(0) },
];

function updateFrameData(frame) {
  for (let i = 0; i < frame.dlc; i++) {
    const delta = Math.floor(Math.random() * 5) - 2;
    let value = frame.data[i] + delta;

    if (value < 0) value = 0;
    if (value > 255) value = 255;

    frame.data[i] = value;
  }
}

function buildCanFrame(frame, source) {
  return {
    ts: Date.now(),
    id: frame.id,
    dlc: frame.dlc,
    data: [...frame.data],
    source
  };
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  let interval = null;

  // 🔥 Слушаем сообщения от клиента
  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message.toString());
      console.log('Received:', msg);

      switch (msg.type) {
        case 'set_baud':
          baudRate = msg.value;
          console.log('Baud rate set to:', baudRate);
          break;

        case 'start':
          if (!interval) {
            running = true;
            interval = setInterval(() => {
              if (!running) return;

              frames.forEach(frame => {
                updateFrameData(frame);
                ws.send(JSON.stringify(buildCanFrame(frame, 'A')));
                ws.send(JSON.stringify(buildCanFrame(frame, 'B')));
              });
            }, 200);
          }
          console.log('Streaming started');
          break;

        case 'stop':
          running = false;
          console.log('Streaming stopped');
          break;

        default:
          console.log('Unknown command');
      }

    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  });

  ws.on('close', () => {
    if (interval) clearInterval(interval);
    console.log('Client disconnected');
  });
});