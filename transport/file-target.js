var fs = require('fs');
var util = require('util');
var Abstract = require('./abstract');
var net = require('net');

function FileTarget(config) {
  this.config = config;
  if (!config.path && !(config.ip && config.port)){
    throw new Error('Local file path or socket ip and port must be specified');
  }
  if (config.path) {
    this.stream = fs.createWriteStream(this.config.path, {
      flags: 'w',
      encoding: 'utf8',
    });
  } else {
    this.stream = net.createConnection(config.port, this.ip);
  }
}
util.inherits(FileTarget, Abstract);

module.exports = FileTarget;
