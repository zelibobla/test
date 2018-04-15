'use strict';

const assert = require('assert');
const { readFileSync } = require('fs');
const Config = require('../config/file-to-file-filter.json');
const Source = require('../transport/file-source');
const Target = require('../transport/file-target');

const source = new Source(Config.source);
const target = new Target(Config.target);

target.stream.on('unpipe', () => {
  const original = readFileSync(Config.source.path);
  const copy = readFileSync(Config.target.path);
  console.log('Stream write test passed');
});
source.stream.pipe(target.stream);
