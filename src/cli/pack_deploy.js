const { compileAndDeploy } = require('../index');

function pack_deploy(packRef, stack, program) {
  if (!stack) {
    console.error('Stack name is required');
  }

  if (!packRef) {
    console.error('Pack name or location is required');
  }

  compileAndDeploy({ packRef, stack });
}

module.exports = pack_deploy;
