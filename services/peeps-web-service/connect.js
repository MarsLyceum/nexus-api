const WebSocket = require('ws');

// Retrieve the URL from the command line arguments
const url = process.argv[2];

if (!url) {
  console.error('Please provide the WebSocket URL as an argument.');
  process.exit(1);
}

const ws = new WebSocket(url, {
  protocol: 'graphql-transport-ws'
});

ws.on('open', function open() {
  console.log('Connected');
  ws.send(JSON.stringify({
    type: 'connection_init',
    payload: {}
  }));
});

ws.on('message', (data) => {
  const message = data.toString();
  try {
    const json = JSON.parse(message);
    console.log('Received:', json);

    if (json.type === 'connection_ack') {
      ws.send(JSON.stringify({
        id: '1',
        type: 'start',
        payload: {
          query: `
              subscription OnGreeting {
                greetings
              }
          `,
          variables: {}
        }
      }));
    }
  } catch (e) {
    console.error('Error parsing JSON:', e);
    console.log('Raw message:', message);
  }
});

ws.on('close', function close(code, reason) {
  console.log(`Disconnected (code: ${code}, reason: "${reason}")`);
});

ws.on('error', function error(err) {
  console.error(`Error: ${err.message}`);
});
