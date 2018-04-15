/**
 * implementation of transforming standard server log string
 * into object
 * @see https://tools.ietf.org/html/rfc5424
 */

 /**
  * little rebus to convert prival into log level
  * @see https://tools.ietf.org/html/rfc5424#section-6.2.1
  * @param {number} prival
  * @returns {string} ERROR|WARNING|INFO|DEBUG
  */
 function privalToLevel(prival){
   const levels = ['ERROR', 'ERROR', 'ERROR', 'ERROR', 'WARNING', 'INFO', 'INFO', 'DEBUG'];
   const levelIndex = prival % 8;
   return levels[levelIndex];
 }

/**
 * recognize from string of known format an object of structured data
 * i.e. [info@app env="prod" type="server"] transforms into
 * { info: { env: 'prod' } }
 * @see https://tools.ietf.org/html/rfc5424#section-6.2.1
 * @param {string} merged 
 * @returns {Object}
 */
function breakDownStructuredData(merged){
  if (merged.indexOf('] [') !== -1) {
    const elements = merged.split('] [');
    const structuredData = {};
    elements.forEach(element => {
      const obj = breakDownStructuredData(element);
      Object.assign(structuredData, obj);
    });
    return structuredData;
  }
  const subElements = merged.replace(/[\[\]]/g, '').match(/([^\s@="]+)/g);
  const structuredData = subElements.reduce((memo, element, index) => {
    if (index === 0 ){
      memo[element] = {};
      return memo;
    }
    if (element === 'server' || index < 2 || index % 2 === 0){
      return memo;
    }
    /** @TODO: it will be expensive on arrays of length over 10^6 elements */
    memo[Object.keys(memo)[0]][subElements[index - 1]] = element;
    return memo;
  }, {});
  return structuredData;
}

 /**
  * having a line like <13>1 2003-10-11T22:14:15.003Z 127.0.0.1 app - - [info@app env="prod" type="server"] INFO
  * return an object with parsing results
  * @param {string} line
  * @returns {Object}
  */
function parse(line) {
  try {
    const regexp = /\<(\d+)\>(\d+)\s(.{24})\s([^\s]+)\s([^\s]+)\s([^\s]+)\s([^\s]+)\s(\[.+\]|\-)\s(.+)/;
    const elements = regexp.exec(line);
    /** JS community misses named regexp groups of ES2018 very much */
    const message = {
      type: 'server',
      prival: elements[1],
      level: privalToLevel(elements[1]),
      version: elements[2],
      timestamp: elements[3],
      host: elements[4],
      app: elements[5],
      pid: elements[6],
      mid: elements[7],
      message: elements[9]
    }
    if (elements[8] !== '-'){
      message.structuredData = breakDownStructuredData(elements[8]);
    }
    return message;
  } catch (error) {
    console.log(`Provided string "${line}" doesn't match expected format ` +
    `<\${prival}>\${version} \${timestamp} \${host} \${app} ` +
    `\${pid} \${mid} \${structured-data} \${message}`, error);
  }
}

module.exports = { parse };