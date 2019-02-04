const compileAndDeploy = require("../index");

function pack_deploy(pack, stack, program) {
  if (!stack) {
    console.error("Stack name is required");
  }

  if (!pack) {
    console.error("Pack name or location is required");
  }

  if (stack && pack) {
    if (program.host) {
      process.env.DOCKER_HOST = program.host;
    }
    compileAndDeploy(stack, pack);
  }
}

module.exports = pack_deploy;
