const yaml = require('js-yaml');
const _ = require('lodash');
const md5 = require('md5');
const nunjucks = require('nunjucks');
const utils = require('../utils');

function compile({ template, values, manifests, stack, packDir }) {
  const env = nunjucks.configure(packDir, { autoescape: false });

  const secrets = [];

  // Extra filters
  env.addFilter('dumpyml', function(o, indent, opts) {
    return yaml
      .safeDump(o, opts)
      .replace(/^/gm, ' '.repeat(indent))
      .trim();
  });

  function generateSecretName(name, value) {
    // Max length 64 chars - remove whitespace
    const secretName = name.replace(/ /g, '_').substr(0, 31);
    const stackName = stack.replace(/ /g, '_').substr(0, 15);
    const hash = md5(value).substr(0, 16);
    return `${stackName}_${secretName}_${hash}`;
  }

  /**
   * opts - set extra options on secret
   *   base64: true - means this value is already base64 encoded, no need to double encode it later
   */
  function secretFromValue(key, opts) {
    const value = utils.getObjectProperty(key, values);
    const name = generateSecretName(key, value);
    secrets.push({
      value,
      name,
      ...opts
    });
    return name;
  }

  function secretLiteral(name, value, opts) {
    const secretName = generateSecretName(name, value);
    secrets.push({
      value,
      name: secretName,
      ...opts
    });
    return secretName;
  }

  env.addGlobal('secret_from_value', secretFromValue);
  env.addGlobal('secret', secretLiteral);

  const interpolatedTpl = nunjucks.renderString(template, values);

  let parsed;
  try {
    parsed = yaml.safeLoad(interpolatedTpl);
  } catch (error) {
    console.log('Error parsing compiled docker-compose.yml');
    console.log(error);
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
  _.forEach(parsed.services, (config, service) => {
    const labels = {
      'pack.manifest.name': manifests.name,
      'pack.manifest.version': manifests.version,
      'com.docker.stack.namespace': stack
    };

    const labelsStr = [
      `pack.manifest.name=${manifests.name}`,
      `pack.manifest.version=${manifests.version}`,
      `com.docker.stack.namespace=${stack}`
    ];

    parsed.services[service] = _.merge(config, {
      deploy: {
        labels: _.concat(config.deploy.labels, labelsStr)
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
