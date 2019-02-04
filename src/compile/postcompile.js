const fs = require('fs');
const yaml = require('js-yaml');
function postcompile(pack) {
  //TODO: Nothing for now

  return {
    ...pack,
    compose: yaml.safeDump(pack.compose)
  }
}

module.exports = postcompile
