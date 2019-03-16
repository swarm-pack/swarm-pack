const yaml = require('js-yaml');
const _ = require('lodash');
const md5 = require('md5');
const nunjucks = require('nunjucks');
const utils = require('../utils');

function compile({ template, values, manifests, stack }) {
  const env = nunjucks.configure({ autoescape: false });

  const secrets = [];

  function sanitizeName(name) {
    return name.substring(0, 8).replace(/ /g, '_');
  }

  function secretFromValue(key) {
    const value = utils.getObjectProperty(key, values);
    // Max length for name is 64 chars
    const name = `${sanitizeName(key.substr(0, 31))}_${md5(value)}`;
    secrets.push({ value, name });
    return name;
  }

  env.addGlobal('secret_from_value', key => secretFromValue(key));

  const interpolatedTpl = nunjucks.renderString(template, values);
  const parsed = yaml.safeLoad(interpolatedTpl);

  // Generate global secrets for any service secrets we processed (e.g. with secret_from_value)
  if (secrets.length > 0) {
    parsed.secrets = secrets.reduce((obj, secret) => {
      obj[secret.name] = { external: true };
      return obj;
    }, parsed.secrets || {});
  }

  // Add swarm-pack service lables
  // TODO - allow passing extra labels from e.g. swarm-sync
  _.forEach(parsed.services, function(config, service) {
    const labels = {
      'pack.manifest.name': manifests.name,
      'pack.manifest.version': manifests.version
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
