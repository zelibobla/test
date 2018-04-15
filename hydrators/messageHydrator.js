/**
 * extract incoming log message into internal format
 * and hydrate 
 */

 /**
  * extract incoming data into internal message object
  * @param {Object} data
  * @param {number} defaultTimestamp to be used when no timestamp defined
  * @returns {void}
  */
const extract = function(data, defaultTimestamp){
  const extracted = {};
  const reservedKeys = [
    'type',
    'app',
    'host',
    'ip',
    'environment',
    'message',
    'error',
    'timestamp',
    'level',
    'structuredData',
    'stack',
    'prival',
    'version'
  ];
  if (data.type) {
    extracted.logsource = data.type;
  }
  if (data.app) {
    extracted.program = data.app;
  }
  if (data.host) {
    extracted.host = data.host;
  }
  if (data.ip) {
    extracted.ip = data.ip;
  }
  if (data.environment) {
    extracted.env = data.environment;
  }
  if (data.message) {
    extracted.message = data.message;
  }
  if (extracted.logsource === 'client' && data.error) {
    extracted.level = 'ERROR';
    extracted.message = data.error;
  } else if (extracted.logsource === 'server' && data.level) {
    extracted.level = data.level;
  }
  if (data.timestamp) {
    extracted.timestamp = new Date(data.timestamp).toISOString();
  }
  if (data.stack) {
    extracted.timestamp = new Date(defaultTimestamp).toISOString();
    extracted.level = 'ERROR';
    extracted.message = data.stack.join(' | ');
  }
  if (data.structuredData) {
    extracted._data = Object.assign({}, data.structuredData);
    /** simple one level more deep copy */
    Object.keys(extracted._data).forEach(key => {
      if (typeof extracted._data[key] === 'object'){
        extracted._data[key] = Object.assign({}, extracted._data[key]);
      }
    });
    /** There is nothing about this in docs, but this is how example expected to work */
    if (data.structuredData.info && data.structuredData.info.env) {
      extracted.env = data.structuredData.info.env;
      delete extracted._data.info.env;
      if (Object.keys(extracted._data.info).length === 0){
        delete extracted._data.info;
      }
    }
  }
  const unexpectedKeys = Object.keys(data).filter(key => reservedKeys.indexOf(key) === -1 &&
    data[key] !== '-'
  );
  if (unexpectedKeys.length > 0){
    if (typeof extracted._data === 'undefined'){
      extracted._data = {};
    }
    unexpectedKeys.forEach(key => extracted._data[key] = data[key]);
  }
  return extracted;
}

module.exports = { extract };