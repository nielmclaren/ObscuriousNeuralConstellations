var SerialPort = require("serialport");

const numStrips = 8;
const numLedsPerStrip = 13;

const gamma = 1.7;
var gammaTable = [];
for (var i = 0; i < 256; i++) {
  gammaTable[i] = Math.floor(Math.pow(i / 255.0, gamma) * 255.0 + 0.5);
}

var pixels = [];
for (var i = 0; i < numStrips * numLedsPerStrip; i++) {
  var strip = i % numStrips;
  var led = Math.floor(i / numStrips);
  if (led === 0) {
    pixels[i] = 0xff0000;
  }
  else if (led === 1) {
    pixels[i] = 0x0000ff;
  }
  else {
    pixels[i] = 0x00ff00;
  }
}

var portName = "/dev/cu.usbmodem862651";
var serial = new SerialPort(portName);

serial.on('open', function() {
  console.log('Serial Port Opened');
  serial.on('data', function(data){
    console.log(data[0]);
  });

  loopLedTest();
});

function loopBasicTest() {
  setInterval(function() {
    serial.write('*');
  }, 2000);

  setTimeout(function() {
    setInterval(function() {
      serial.write('#');
    }, 2000);
  }, 1000);
}

function loopLedTest() {
  var buffer = new Buffer(24 * numLedsPerStrip);

  setTimeout(function() {
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
  }, 50);
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
