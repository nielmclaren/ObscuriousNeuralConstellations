var socketServerPort = 3001;

var host = window.document.location.host.replace(/:.*/, '');
var ws = new WebSocket('ws://' + host + ':' + socketServerPort);

ws.onmessage = function(event) {
  var message = event.data;
  $('.preset').removeClass('selected');
  $('.' + message).addClass('selected');
};

function preset(message) {
  ws.send(message);
}

