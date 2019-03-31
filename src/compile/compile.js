const yaml = require('js-yaml');
const _ = require('lodash');
const md5 = require('md5');
const nunjucks = require('nunjucks');
const utils = require('../utils');

function compile({ template, values, manifests, stack, packDir }) {
  const env = nunjucks.configure(packDir, { autoescape: false });

  const secrets = [];

  function sanitizeName(name) {
    return name.substring(0, 8).replace(/ /g, '_');
  }

  /**
   * opts - set extra options on secret
   *   base64: true - means this value is already base64 encoded, no need to double encode it later
   */
  function secretFromValue(key, opts) {
    const value = utils.getObjectProperty(key, values);
    // Max length for name is 64 chars
    const name = `${sanitizeName(opts.name || key.substr(0, 31))}_${md5(value)}`;
    secrets.push({ value, name, ...opts });
    return name;
  }

  env.addGlobal('secret_from_value', secretFromValue);

  const interpolatedTpl = nunjucks.renderString(template, values);

  let parsed;
  try {
    parsed = yaml.safeLoad(interpolatedTpl);
  } catch (error) {
    console.log('Error parsing compiled docker-compose.yml');
    console.log(error.reason);
    console.log(interpolatedTpl);
    process.exit(1);
  }

  // Generate global secrets for any service secrets we processed (e.g. with secret_from_value)
  if (secrets.length > 0) {
    parsed.secrets = secrets.reduce((obj, secret) => {
      const result = { ...obj };
      result[secret.name] = { external: true };
      return result;
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
