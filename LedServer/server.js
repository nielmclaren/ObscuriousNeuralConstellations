#!/usr/bin/env node

const socketServerPort = 3001;
const httpServerPort = 3000;

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({port: socketServerPort});
const express = require('express');
const app = express();

var SerialPort = require("serialport");
const numStrips = 8;
const numLedsPerStrip = 13;

const gamma = 1.7;
var gammaTable = getGammaTable();

var portName = "/dev/cu.usbmodem862651";
var serial = new SerialPort(portName);

var pixels = getPixels();

var currLed = 0;

initSocketServer();
initHttpServer();
initSerialPort();

function initSocketServer() {
  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);

      if (currLed++ >= numLedsPerStrip) {
        currLed = 0;
      }
      pixels = getPixels();
      sendLedData();
    });

    console.log('WebSocket connected');
  });
}

function initHttpServer() {
  app.use(express.static('public'));
  app.listen(httpServerPort, (err) => {
    if (err) {
      return console.log('Error: ', err);
    }

    console.log(`HTTP server is listening on ${httpServerPort}`);
  });
}

function getGammaTable() {
  var result = [];
  for (var i = 0; i < 256; i++) {
    result[i] = Math.floor(Math.pow(i / 255.0, gamma) * 255.0 + 0.5);
  }
  return result;
}

function getPixels() {
  var result = [];
  for (var i = 0; i < numStrips * numLedsPerStrip; i++) {
    var strip = i % numStrips;
    var led = Math.floor(i / numStrips);
    if (led === currLed) {
      result[i] = 0x330000;
    }
    else if (Math.abs(currLed - led) < 2) {
      result[i] = 0x000033;
    }
    else {
      result[i] = 0x003300;
    }
  }
  return result;
}

function initSerialPort() {
  serial.on('open', function() {
    console.log('Serial Port Opened');
    serial.on('data', function(data){
      console.log(data[0]);
    });

    pixels = getPixels();
    sendLedData();
  });
}

function sendLedData() {
  var buffer = new Buffer(24 * numLedsPerStrip);
  var offset = 0;

  serial.write('*');
  for (var i = 0; i < numLedsPerStrip; i++) {
    for (var mask = 0x800000; mask != 0; mask >>= 1) {
      var b = 0;
      for (var strip = 0; strip < numStrips; strip++) {
        if ((pixels[i * numStrips + strip] & mask) != 0) {
          b |= (1 << strip);
        }
      }
      buffer[offset++] = b;
    }
  }

  serial.write(buffer);
}

function binarize(n, len) {
  var s = n.toString(2);
  if (arguments.length > 1) {
    while (s.length < len) {
      s = '0' + s;
    }
  }
  return s;
}

