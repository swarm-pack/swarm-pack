const { compileAndDeploy } = require('../index');

function pack_deploy(packDir, stack, program) {
  if (!stack) {
    console.error('Stack name is required');
  }

  if (!packDir) {
    console.error('Pack name or location is required');
  }

  compileAndDeploy({ packDir, stack });
}

module.exports = pack_deploy;
