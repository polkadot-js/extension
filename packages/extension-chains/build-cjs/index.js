"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bundle = require("./bundle");

Object.keys(_bundle).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _bundle[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _bundle[key];
    }
  });
});