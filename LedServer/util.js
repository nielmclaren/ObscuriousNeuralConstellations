module.exports = (function() {
  const gamma = 1.7;
  const gammaTable = getGammaTable();

  const EXPORT = {
    adjustBrightness: function(c, brightness) {
      var r = (c & 0xff0000) >> 16;
      var g = (c & 0xff00) >> 8;
      var b = (c & 0xff);

      r = gammaTable[Math.floor(r * brightness)];
      g = gammaTable[Math.floor(g * brightness)];
      b = gammaTable[Math.floor(b * brightness)];

      c = (r << 16) + (g << 8) + b;

      return c;
    },

    modTime: function(period) {
      var now = (new Date()).getTime();
      return (now % period) / period;
    },

    clampTime: function(t) {
      while (t >= 1) {
        t -= 1;
      }
      while (t <= 0) {
        t += 1;
      }
      return t;
    },

    splitTime: function(t) {
      if (t < 0.5) {
        return 2.0 * t;
      }
      else {
        return (1.0 - t) * 2.0;
      }
    },

    lerpColor: function(a, b, t) {
      var ar = (a & 0xff0000) >> 16;
      var ag = (a & 0xff00) >> 8;
      var ab = (a & 0xff);

      var br = (b & 0xff0000) >> 16;
      var bg = (b & 0xff00) >> 8;
      var bb = (b & 0xff);

      var cr = ar + t * (br - ar);
      var cg = ag + t * (bg - ag);
      var cb = ab + t * (bb - ab);

      c = (cr << 16) + (cg << 8) + cb;

      return c;
    },
  };

  return EXPORT;

  function getGammaTable() {
    var result = [];
    for (var i = 0; i < 256; i++) {
      result[i] = Math.floor(Math.pow(i / 255.0, gamma) * 255.0 + 0.5);
    }
    return result;
  }
}());
