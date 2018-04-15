const assert = require('assert');
const RFC5424Service = require('../services/RFC5424Service');

let string = '<13>1 2003-10-11T22:14:15.003Z 127.0.0.1 app - - ' +
  '[info@app env="prod" type="server"] [data@app some="data"] ERROR';
let message = RFC5424Service.parse(string);
assert.equal(message.message, 'ERROR', `${string} level is not recognized as ERROR`);
assert.equal(
  typeof message.structuredData,
  'object',
  `${message.structuredData} structuredData is not an object`
);
assert.equal(
    typeof message.structuredData.data,
    'object',
    `${message.structuredData.data} structuredData.data is not an object`
  );
assert.equal(
  message.structuredData.data.some,
  'data',
  `${message.structuredData.data.some} structuredData.data.some is not recognized as 'data'`
);
assert.equal(
    typeof message.structuredData.info,
    'object',
    `${message.structuredData.info} structuredData.info is not an object`
  );
assert.equal(
  message.structuredData.info.env,
  'prod',
  `${message.structuredData.info.env} structuredData.info.env is not recognized as 'prod'`
);


string = '<13>1 2003-10-11T22:14:15.003Z 127.0.0.1 app - - ' +
  '[info@app env="prod" type="server"] INFO';
message = RFC5424Service.parse(string);
assert.equal(message.message, 'INFO', `${string} level is not recognized as INFO`);
assert.equal(
  typeof message.structuredData,
  'object',
  `${message.structuredData} structuredData is not an object`
);
assert.equal(
    typeof message.structuredData.info,
    'object',
    `${message.structuredData.info} structuredData.info is not an object`
  );
assert.equal(
  message.structuredData.info.env,
  'prod',
  `${message.structuredData.info.env} structuredData.info.env is not recognized as 'prod'`
);


string = '<11>1 2003-10-11T22:14:15.003Z 127.0.0.1 app 10000 - - ERROR';
message = RFC5424Service.parse(string);
assert.equal(message.message, 'ERROR', `${string} level is not recognized as ERROR`);
console.log('RFC5424Service test passed');
