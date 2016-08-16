
var util = require('./util');

module.exports = (function() {
  return function(numStripsArg, numLedsPerStripArg) {
    var self = this;
    var numStrips = numStripsArg;
    var numLedsPerStrip = numLedsPerStripArg;
    var pixels = [];

    self.getPixelsRef = function() {
      return pixels;
    };

    self.getOctoBuffer = function() {
      var offset = 0;
      var buffer = new Buffer(24 * numLedsPerStrip);

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

      return buffer;
    };

    self.setPixelColor = function(stripIndex, pixelIndex, c) {
      pixels[pixelIndex * numStrips + stripIndex] = c;
    };

    self.setStripColor = function(stripIndex, c) {
      for (var i = 0; i < numLedsPerStrip; i++) {
        pixels[i * numStrips + stripIndex] = c;
      }
    };

    self.setColor = function(c) {
      for (var i = 0; i < numStrips * numLedsPerStrip; i++) {
        pixels[i] = c;
      }
    };

    self.adjustBrightness = function(brightness) {
      for (var i = 0; i < numStrips * numLedsPerStrip; i++) {
        pixels[i] = util.adjustBrightness(pixels[i], brightness);
      }
    };
  };
}());
