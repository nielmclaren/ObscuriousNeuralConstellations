#!/usr/bin/env node

const socketServerPort = 3001;
const httpServerPort = 3000;

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({port: socketServerPort});
const express = require('express');
const app = express();

var SerialPort = require("serialport");

const numStrips = 8;
const numLedsPerStrip = 30;

const gamma = 1.7;
var gammaTable = getGammaTable();

var portName = "/dev/cu.usbmodem862651";
var serial = new SerialPort(portName);

var pixels = [];

var currLed = 0;

const BLACK = 0x000000;
const RED = 0xFF0000;
const GREEN = 0x00FF00;
const BABYBLUE = 0x6666FF;
const BLUE = 0x0000FF;
const YELLOW = 0xFF9900;
const VIOLET = 0x4400FF;
const PINK = 0xFF1088;
const ORANGE = 0xE05800;
const WHITE = 0xFFFFFF;

const numRhombododdies = 24;
const numSides = 12;
const walkData = [
  [ 1,  2],
  [ 0,  2,  3],
  [ 0,  1,  3,  5, 10, 11, 12, 13],
  [ 1,  2,  4, 10, 13],
  [ 3,  5,  9, 10],
  [ 2,  4,  6,  8,  9, 10, 11],
  [ 5,  7,  8,  9],
  [ 6, 17,  8],
  [ 5,  6,  7,  9, 11, 17, 16],
  [ 4,  5,  6,  8, 10, 16, 17],
  [ 2,  3,  4,  5,  9, 11, 13, 15, 16],
  [ 2,  5,  8, 10, 12, 15, 16],
  [ 2, 11, 13, 14, 15],
  [ 2,  3, 12, 10, 14, 15],
  [12, 13, 15],
  [10, 11, 12, 13, 14, 16, 19, 23],
  [ 8,  9, 10, 11, 15, 17, 18, 19, 20, 22],
  [ 7,  8,  9, 16, 18, 22],
  [16, 17, 19, 20, 21, 22],
  [15, 16, 18, 20, 23],
  [18, 19, 21, 22, 23],
  [18, 20, 22],
  [16, 17, 18, 20, 21, 23],
  [15, 16, 19, 20, 22],
];

const maxInfections = 9;

var prevInfections = [15];
var infections = [15];
var prevInfectTime = 0;

initSocketServer();
initHttpServer();
initSerialPort();
initLoop();

lerpColor(0xff0000, 0x00ff00, 0.5);

function initSocketServer() {
  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);

      if (currLed++ >= numLedsPerStrip) {
        currLed = 0;
      }
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

function initSerialPort() {
  serial.on('open', function() {
    console.log('Serial Port Opened');
    serial.on('data', function(data){
      console.log(data[0]);
    });
  });
}

function initLoop() {
  setInterval(function() {
    updatePixels();
    sendLedData();
  }, 50);
}

function updatePixels() {
  for (var i = 0; i < numStrips * numLedsPerStrip; i++) {
    pixels[i] = 0;
  }

  updateSpine(1);
  updateNodes(3);
  updateMiniMoshi(6);
  updateBlobbyHead(7);
}

function updateSpine(stripIndex) {
  var t = modTime(7000);
  setPixelColor(stripIndex, 0, lerpColor(YELLOW, VIOLET, splitTime(clampTime(t))));
  setPixelColor(stripIndex, 1, lerpColor(YELLOW, VIOLET, splitTime(clampTime(t + 0.1))));
  setPixelColor(stripIndex, 2, lerpColor(YELLOW, VIOLET, splitTime(clampTime(t + 0.2))));
  setPixelColor(stripIndex, 3, lerpColor(YELLOW, VIOLET, splitTime(clampTime(t + 0.4))));
  setPixelColor(stripIndex, 4, lerpColor(YELLOW, VIOLET, splitTime(clampTime(t + 0.6))));
  setPixelColor(stripIndex, 6, lerpColor(YELLOW, VIOLET, splitTime(clampTime(t + 0.8))));
  setPixelColor(stripIndex, 5, lerpColor(YELLOW, VIOLET, splitTime(clampTime(t + 0.9))));
}

function updateNodes(stripIndex) {
  for (var i = 0; i < 40; i++) {
    setPixelColor(stripIndex, i, 0xee5500);
  }
}

function updateMiniMoshi(stripIndex) {
  var t = modTime(8000);
  for (var i = 0; i < numLedsPerStrip; i++) {
    setPixelColor(stripIndex, i, lerpColor(YELLOW, PINK, splitTime(clampTime(t + 0.1 * i))));
  }
}

function updateMiniMoshiInfectionVersion(stripIndex) {
  colorWipe(PINK);
  for (var i = 0; i < prevInfections.length; i++) {
    setPixelColor(stripIndex, prevInfections[i], BABYBLUE);
  }
  for (var i = 0; i < infections.length; i++) {
    setPixelColor(stripIndex, infections[i], YELLOW);
  }

  stepInfections();
}

function stepInfections() {
  var now = (new Date()).getTime();
  if (now - prevInfectTime > 1600) {
    for (var i = 0; i < infections.length; i++) {
      if (infections.length > 1 && Math.random() < 0.2) {
        infections.splice(i, 1);
        i--;
      }
      else {
        if (infections.length < maxInfections && Math.random() < 0.4) {
          infections.push(nextIndex(infections[i], prevInfections[i]));
        }
        infections[i] = nextIndex(infections[i]);
      }
    }
    prevInfections = infections.slice();
    prevInfectTime = now;
  }
}

function nextIndex(index) {
  return nextIndex(index, -1);
}

function nextIndex(index, noVisitIndex) {
  var nextIndex;
  while ((nextIndex = walkData[index][Math.floor(Math.random() * walkData[index].length)]) === noVisitIndex) {};
  return nextIndex;
}

function updateBlobbyHead(stripIndex) {
  var dark = 0x999999;
  var light = 0xffffff;
  setPixelColor(stripIndex, 0, lerpColor(dark, light, splitTime(modTime(1800))));
  setPixelColor(stripIndex, 1, lerpColor(dark, light, splitTime(modTime(1600))));
  setPixelColor(stripIndex, 2, lerpColor(dark, light, splitTime(modTime(1550))));
  setPixelColor(stripIndex, 3, lerpColor(dark, light, splitTime(modTime(1100))));
}

function setPixelColor(stripIndex, pixelIndex, c) {
  pixels[pixelIndex * numStrips + stripIndex] = c;
}

function colorWipe(stripIndex, c) {
  for (var i = 0; i < numLedsPerStrip; i++) {
    pixels[i * numStrips + stripIndex] = c;
  }
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

function modTime(period) {
  var now = (new Date()).getTime();
  return (now % period) / period;
}

function clampTime(t) {
  while (t >= 1) {
    t -= 1;
  }
  while (t <= 0) {
    t += 1;
  }
  return t;
}

function splitTime(t) {
  if (t < 0.5) {
    return 2.0 * t;
  }
  else {
    return (1.0 - t) * 2.0;
  }
}

function lerpColor(a, b, t) {
  ar = (a & 0xff0000) >> 16;
  ag = (a & 0xff00) >> 8;
  ab = (a & 0xff);

  br = (b & 0xff0000) >> 16;
  bg = (b & 0xff00) >> 8;
  bb = (b & 0xff);

  cr = ar + t * (br - ar);
  cg = ag + t * (bg - ag);
  cb = ab + t * (bb - ab);

  c = (cr << 16) + (cg << 8) + cb;

  return c;
}
