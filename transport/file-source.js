var fs = require('fs');
var net = require('net');
var util = require('util');
var stream = require('stream');

var Abstract = require('./abstract');
var RFC5424Service = require('../services/RFC5424Service');
var messageHydrator = require('../hydrators/messageHydrator');


/**
 * split text chunk data into array of message objects
 * @param {string} data 
 * @returns {Array.<Message>}
 * @todo handle the case when message stack is broken into two or more chunks
 */
function rawToArray(data) {
  try {
    var lines = data.split('\n');
  } catch (error) {
    console.log('Unable to parse chunk data', error);
  }
  let isStackGathering = false;
  var messages = lines.reduce((memo, line) => {
    if (!line) {
      return memo;
    }
    if (line[0] === '{') {
      var message = JSON.parse(line);
      isStackGathering = false;
    } else if (line[0] === '<') {
      var message = RFC5424Service.parse(line);
      isStackGathering = false;
    } else {
      if (!isStackGathering){
        var message = {};
        isStackGathering = true;
      } else {
        var message = memo.pop();
      }
      if (!message.stack) {
        message.stack = [];
      }
      message.stack.push(line);
    }
    memo.push(message);
    return memo;
  }, []);
  return messages;
}

/**
 * @var prevTimestamp cross chunks previous timestamp
 * used to set timestamp of the stack trace error message
 */
let prevTimestamp = undefined;

/**
 * parse obtained chunk, filter it due to rules, merge result and emit it into readable stream
 * @param {string} data 
 * @param {Stream} stream
 * @param {Array} filterOutLevels
 * @returns {void}
 * @todo nested filtering lookup might be avoided 
 */
function handleSourceChunk(data, stream, filterOutLevels) {
  var messages = rawToArray(data);
  var merged = messages.map(message => {
    const extracted = messageHydrator.extract(message, prevTimestamp);
    prevTimestamp = new Date(extracted.timestamp).getTime();
    return extracted;
  }).filter(message =>
    filterOutLevels.indexOf(message.level) === -1
  ).map(JSON.stringify).join('\n');
  stream.push(merged);
}

/**
 * A constructor expected to be called with `new` operand
 * Once object created listen to it's .stream field and do whatever you want further
 * @param {Object} config
 * @returns {void}
 */
function FileSource(config) {
  this.config = config;
  if (!config.path && !(config.ip || !config.port)){
    throw new Error('Local file path or socket ip and port must be specified');
  }
  if (!config.filterOutLevels ||
    typeof config.filterOutLevels[Symbol.iterator] !== 'function' ){
    console.log(`config.filterOutLevels dropped to default empty array`);
    config.filterOutLevels = [];
  }
  if (config.path) {
    this.rawStream = fs.createReadStream(this.config.path, {
      flags: 'r',
      encoding: 'utf8',
    });
  } else {
    this.rawStream = net.createConnection(config.port, this.ip);
  }
  this.rawStream.on('data', (data) => handleSourceChunk(data, this.stream, config.filterOutLevels));
  this.rawStream.on('close', () => this.stream.push(null));
  this.stream = new stream.Readable();
  this.stream._read = function noop() {}; // @see https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js
}
util.inherits(FileSource, Abstract);

module.exports = FileSource;
