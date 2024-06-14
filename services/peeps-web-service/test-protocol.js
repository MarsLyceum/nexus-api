const WebSocket = require('ws');

function testConnection(url, protocol) {
  const ws = new WebSocket(url, {
    protocol: protocol
  });

  ws.on('open', function open() {
    console.log(`Connected to ${url} with protocol: "${protocol}"`);
    ws.send(JSON.stringify({
      type: 'connection_init',
      payload: {} // add your payload here if needed
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
    console.log(`Disconnected from ${url} (code: ${code}, reason: "${reason}") with protocol: "${protocol}"`);
  });

  ws.on('error', function error(err) {
    console.error(`Error: ${err.message} with protocol: "${protocol}"`);
  });
}

const url = process.argv[2];

if (!url) {
  console.error('Please provide the WebSocket URL as an argument.');
  process.exit(1);
}

const protocols = ['', 'graphql-ws', 'graphql-transport-ws', 'graphql-subscriptions'];

protocols.forEach(protocol => {
  testConnection(url, protocol);
});
