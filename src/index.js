const yaml = require("js-yaml");
const fs = require('fs-extra');
const {resolve} = require('path');
const compile = require("./compile/compile");
const deploy = require("./deploy");
const docker = require("../utils/docker");

async function compileAndDeploy({ 
  stack, 
  packDir = process.cwd(),
  values = {},
  secretsDir = resolve(process.cwd(), 'secrets'),
  dockerConfig = false
}) {

  // Config passed to method
  if (dockerConfig) {
    docker.configure({ ...dockerConfig });
  }

  // Required files
  const packContent = yaml.safeLoad( await fs.readFile(resolve(packDir, 'packfile.yml')))
  const template = ( await fs.readFile(resolve(packDir, 'docker-compose.tpl.yml')) ).toString('utf8')

  // Optional files
  const defaults = yaml.safeLoad( await fs.readFile(resolve(packDir, 'defaults.yml')).catch(() => ''))

  values = Object.assign({}, defaults, values)

  return deploy(
    compile({
      manifests: packContent.pack,
      packDir,
      template,
      values,
      stack
    })
  );

}

module.exports = { 
  compileAndDeploy,
  compile,
  deploy
}
