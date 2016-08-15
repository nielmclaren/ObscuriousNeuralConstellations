var socketServerPort = 3001;

var host = window.document.location.host.replace(/:.*/, '');
var ws = new WebSocket('ws://' + host + ':' + socketServerPort);

ws.onmessage = function (event) {
  document.getElementById('readout').value = event.data;
};

function up() {
  ws.send('up');
}

function down() {
  ws.send('down');
}

