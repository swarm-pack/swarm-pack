const compile = require('./compile/compile');
const deploy = require('./deploy');
const yaml = require('js-yaml');

const compiled = compile();

deploy(compiled);


