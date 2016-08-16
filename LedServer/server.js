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

var brightness = 0.5;

initSocketServer();
initHttpServer();
initSerialPort();
initLoop();

function initSocketServer() {
  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      console.log('received: %s', message);
      handleMessage(message, ws);
    });

    console.log('WebSocket connected');
  });
}

function handleMessage(message, ws) {
  switch (message) {
    case 'up':
      brightness += 0.02;
      if (brightness > 1) brightness = 1;
      ws.send('' + Math.floor(100 * brightness) + '%');
      break;
    case 'down':
      brightness -= 0.02;
      if (brightness < 0) brightness = 0;
      ws.send('' + Math.floor(100 * brightness) + '%');
      break;
  }
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
  }, 10);
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

function updateMiniMoshiInfectionVersion(stripIndex) {
  colorWipe(PINK);
  for (var i = 0; i < prevInfections.length; i++) {
    ledModel.setPixelColor(stripIndex, prevInfections[i], BABYBLUE);
  }
  for (var i = 0; i < infections.length; i++) {
    ledModel.setPixelColor(stripIndex, infections[i], YELLOW);
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
  ledModel.setPixelColor(stripIndex, 0, util.lerpColor(dark, light, util.splitTime(util.modTime(1800))));
  ledModel.setPixelColor(stripIndex, 1, util.lerpColor(dark, light, util.splitTime(util.modTime(1600))));
  ledModel.setPixelColor(stripIndex, 2, util.lerpColor(dark, light, util.splitTime(util.modTime(1550))));
  ledModel.setPixelColor(stripIndex, 3, util.lerpColor(dark, light, util.splitTime(util.modTime(1100))));
}

function sendLedData() {
  ledModel.adjustBrightness(brightness);

  var buffer = ledModel.getOctoBuffer();
  serial.write('*');
  serial.write(buffer);
}

