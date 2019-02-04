const compile = require("./compile/compile");
const deploy = require("./deploy");
const yaml = require("js-yaml");

async function compileAndDeploy(stack, packname) {
  const compiled = compile(packname);

  compiled.stack = stack;
  deploy(compiled);
}

module.exports = compileAndDeploy
