const yaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');
const deepExtend = require('deep-extend');
const compile = require('./compile/compile');
const deploy = require('./deploy');
const { inspectPack } = require('./repo');
const { searchRepositories } = require('./query');

async function compileAndDeploy({ stack, packRef, values = {} }) {
  const pack = await inspectPack(packRef);

  // Required files
  const template = (await fs.readFile(
    path.join(pack.dir, 'docker-compose.tpl.yml')
  )).toString('utf8');

  // Optional files
  const defaultsStr = await fs
    .readFile(path.join(pack.dir, 'defaults.yml'))
    .catch(() => '');
  let defaults;
  try {
    defaults = yaml.safeLoad(defaultsStr);
  } catch (error) {
    console.log('Error parsing defaults.yml');
    console.log(error.reason);
    console.log(defaultsStr);
    process.exit(1);
  }

  const newValues = deepExtend({}, defaults, values);

  return deploy(
    compile({
      manifests: pack.packFile.pack,
      packDir: pack.dir,
      template,
      values: newValues,
      stack
    })
  );
}

module.exports = {
  compileAndDeploy,
  compile,
  deploy,
  inspectPack,
  searchRepositories
};
