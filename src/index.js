const yaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');
const compile = require('./compile/compile');
const deploy = require('./deploy');
const docker = require('./utils/docker');
const repo = require('./repo');

async function compileAndDeploy({
  stack,
  packRef = process.cwd(),
  values = {},
  dockerConfig = false
}) {
  // Config passed to method
  if (dockerConfig) {
    docker.configure({ ...dockerConfig });
  }

  const pack = await repo.inspectPack(packRef);

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
  deploy
};
