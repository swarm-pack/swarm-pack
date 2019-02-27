const yaml = require("js-yaml");
const cuid = require("cuid");
const _ = require("lodash");
const path = require('path');

function compile({ template, values, manifests, packDir, secretsDir, stack }) {

  const nunjucks = require("nunjucks");
  const env = nunjucks.configure({ autoescape: true });  

  env.addGlobal("secret_from_file", (source) => secretFrom(source, 'file'));
  env.addGlobal("secret_from_string", (source) => secretFrom(source, 'string'));

  const secrets = [];

  function sanitizeName(name) {
    return name.substring(0,8).replace(/ /g,"_");
  }

  function secretFrom(source, type) {
    const name = `pack_${manifests.name}_${sanitizeName(source)}_${cuid.slug()}`;
    if (type === 'file') {
      source = path.join(secretsDir, source)
    }
    secrets.push({ type, name, source });
    return name;
  }

  allSecrets = secrets;
  const interpolatedTpl = nunjucks.renderString(template, values);

  const parsed = yaml.safeLoad(interpolatedTpl);

  //Generate global secrets for any service secrets we processed (e.g. with secret_from_file)
  if (secrets.length > 0) {
    parsed.secrets = secrets.reduce((obj, secret) => { 
      obj[secret.name] = { 'external': true };
      return obj;
    }, parsed.secrets || {});
  }

  // Add swarm-pack service lables
  // TODO - allow passing extra labels from e.g. swarm-sync 
  _.forEach(parsed.services, function(config, service) {
    const labels =  {
      "pack.manifest.name": manifests.name,
      "pack.manifest.version": manifests.version
    };

    parsed.services[service] = _.merge(config, {
      deploy: {
        labels
      },
      labels
    });
  });

  return {
    template,
    values,
    secrets,
    compose: yaml.safeDump(parsed),
    manifests,
    stack
  };
}

module.exports = compile;
