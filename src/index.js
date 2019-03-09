const yaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');
const compile = require('./compile/compile');
const deploy = require('./deploy');
const docker = require('./utils/docker');
const { inspectPack } = require('./repo');

async function compileAndDeploy({ stack, packRef, values = {} }) {
  const pack = await inspectPack(packRef);

  // Required files
  const template = (await fs.readFile(path.join(pack.dir, 'docker-compose.tpl.yml'))).toString('utf8');

  // Optional files
  const defaults = yaml.safeLoad(
    await fs.readFile(path.join(pack.dir, 'defaults.yml')).catch(() => '')
  );

  const newValues = Object.assign({}, defaults, values);

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
  inspectPack
};
