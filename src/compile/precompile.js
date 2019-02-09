const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function precompile(location) {
  const packContent = fs.readdirSync(location);

  if(packContent.indexOf('packfile.yml') == -1 || !fs.lstatSync(location + '/packfile.yml').isFile()) {
    throw Error('Pack is missing packfile.yml');
  }

  if(packContent.indexOf('docker-compose.tpl.yml') == -1 || !fs.lstatSync(location + '/docker-compose.tpl.yml').isFile()) {
    throw Error('Pack is missing docker-compose.tpl.yml');
  }

  let values = null;
  if(packContent.indexOf('values.yml') != -1 && fs.lstatSync(path.join(location,'values.yml')).isFile()) {
    values = yaml.safeLoad(fs.readFileSync(path.join(location, 'values.yml'), 'utf8'));
  }

  const c = {
    manifests: yaml.safeLoad(fs.readFileSync(path.join(location, 'packfile.yml'))).pack,
    template: fs.readFileSync(path.join(location, 'docker-compose.tpl.yml'), 'utf8'),
    values,
    location
  }

  return c;
}

module.exports = precompile
