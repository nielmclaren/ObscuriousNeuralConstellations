var socketServerPort = 3001;

var host = window.document.location.host.replace(/:.*/, '');
var ws = new WebSocket('ws://' + host + ':' + socketServerPort);

ws.onmessage = function (event) {
  console.log(event.data);
};

function test() {
  ws.send('test');
}

