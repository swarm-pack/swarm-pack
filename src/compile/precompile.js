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

  let s;
  if(packContent.indexOf('secrets') != -1 && fs.lstatSync(location + '/secrets').isDirectory()) {
    const secrets = fs.readdirSync(location + '/secrets');

    s = secrets.map(s => ({
      name: path.basename(s, '.yml'),
      value: fs.readFileSync(path.join(location, 'secrets', s), 'utf8')
    }))
  }

  let values = null;
  if(packContent.indexOf('values.yml') != -1 && fs.lstatSync(path.join(location,'values.yml')).isFile()) {
    values = yaml.safeLoad(fs.readFileSync(path.join(location, 'values.yml'), 'utf8'));
  }

  const c = {
    secrets: s,
    manifests: yaml.safeLoad(fs.readFileSync(path.join(location, 'packfile.yml'))).pack,
    template: fs.readFileSync(path.join(location, 'docker-compose.tpl.yml'), 'utf8'),
    values
  }

  return c;
}

module.exports = precompile
