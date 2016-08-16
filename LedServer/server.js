#!/usr/bin/env node

var LedModel = require('./ledModel');
var util = require('./util');

const socketServerPort = 3001;
const httpServerPort = 3000;

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({port: socketServerPort});
const express = require('express');
const app = express();

var SerialPort = require("serialport");

const numStrips = 8;
const numLedsPerStrip = 30;

var portName = "/dev/cu.usbmodem862651";
var serial = new SerialPort(portName);

var ledModel = new LedModel(numStrips, numLedsPerStrip);

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

const MODE_OFF = 'off';
const MODE_LOW = 'low';
const MODE_HIGH = 'high';

var currMode = MODE_HIGH;

var brightness = getTargetBrightness(currMode);
var brightnessDelta = 0.02;

initSocketServer();
initHttpServer();
initSerialPort();
initLoop();

var sockets = [];

function initSocketServer() {
  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
      handleMessage(message, ws);
    });

    ws.on('close', function() {
      var index = sockets.indexOf(ws);
      if (index >= 0) {
        console.log('Closed socket');
        sockets.splice(index, 1);
      }
    });

    sockets.push(ws);
    ws.send(currMode);

    console.log('WebSocket connected');
  });
}

function handleMessage(message, ws) {
  switch (message) {
    case 'off':
    case 'low':
    case 'high':
      setMode(message);
      sockets.forEach(function(ws) {
        ws.send(message);
      });
      break;
    default:
      console.log('Unknown message: ' + message);
  }
}

function initHttpServer() {
  app.use(express.static(__dirname + '/public'));
  app.listen(httpServerPort, (err) => {
    if (err) {
      return console.log('Error: ', err);
    }

    console.log(`HTTP server is listening on ${httpServerPort}`);
  });
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
    updateBrightness();
    updatePixels();
    sendLedData();
  }, 100);
}

function setMode(mode) {
  currMode = mode;
}

function updateBrightness() {
  var target = getTargetBrightness(currMode);
  if (brightness > target + brightnessDelta) {
    brightness -= brightnessDelta;
  }
  else if (brightness < target - brightnessDelta) {
    brightness += brightnessDelta;
  }
  else {
    brightness = target;
  }
}

function getTargetBrightness(mode) {
  switch(mode) {
    case MODE_OFF:
      return 0;
    case MODE_LOW:
      return 0.3;
    case MODE_HIGH:
      return 0.7;
    default:
      return 0;
  }
}

function updatePixels() {
  ledModel.setColor(0);

  updateSpine(1);
  updateNodes(3);
  updateMiniMoshi(6);
  updateBlobbyHead(7);
}

function updateSpine(stripIndex) {
  var t = util.modTime(7000);
  ledModel.setPixelColor(stripIndex, 0, util.lerpColor(YELLOW, VIOLET, util.splitTime(util.clampTime(t))));
  ledModel.setPixelColor(stripIndex, 1, util.lerpColor(YELLOW, VIOLET, util.splitTime(util.clampTime(t + 0.1))));
  ledModel.setPixelColor(stripIndex, 2, util.lerpColor(YELLOW, VIOLET, util.splitTime(util.clampTime(t + 0.2))));
  ledModel.setPixelColor(stripIndex, 3, util.lerpColor(YELLOW, VIOLET, util.splitTime(util.clampTime(t + 0.4))));
  ledModel.setPixelColor(stripIndex, 4, util.lerpColor(YELLOW, VIOLET, util.splitTime(util.clampTime(t + 0.6))));
  ledModel.setPixelColor(stripIndex, 6, util.lerpColor(YELLOW, VIOLET, util.splitTime(util.clampTime(t + 0.8))));
  ledModel.setPixelColor(stripIndex, 5, util.lerpColor(YELLOW, VIOLET, util.splitTime(util.clampTime(t + 0.9))));
}

function updateNodes(stripIndex) {
  for (var i = 0; i < 40; i++) {
    ledModel.setPixelColor(stripIndex, i, 0xee5500);
  }
}

function updateMiniMoshi(stripIndex) {
  var t = util.modTime(8000);
  for (var i = 0; i < numLedsPerStrip; i++) {
    ledModel.setPixelColor(stripIndex, i, util.lerpColor(YELLOW, PINK, util.splitTime(util.clampTime(t + 0.1 * i))));
  }
}

function updateBlobbyHead(stripIndex) {
  var dark = 0xdddddd;
  var light = 0xffffff;
  ledModel.setPixelColor(stripIndex, 0, util.lerpColor(dark, light, util.splitTime(util.modTime(3800))));
  ledModel.setPixelColor(stripIndex, 1, util.lerpColor(dark, light, util.splitTime(util.modTime(3600))));
  ledModel.setPixelColor(stripIndex, 2, util.lerpColor(dark, light, util.splitTime(util.modTime(3550))));
  ledModel.setPixelColor(stripIndex, 3, util.lerpColor(dark, light, util.splitTime(util.modTime(3100))));
}

function sendLedData() {
  ledModel.adjustBrightness(brightness);

  var buffer = ledModel.getOctoBuffer();
  serial.write('*');
  serial.write(buffer);
}

