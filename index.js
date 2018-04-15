var Config = require('./config/file-to-file.json');
var Source = require('./transport/file-source');
var Target = require('./transport/file-target');

var source = new Source(Config.source);
var target = new Target(Config.target);

source.stream.pipe(target.stream);
