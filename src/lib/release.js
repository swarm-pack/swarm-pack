const yaml = require('js-yaml');
const deepExtend = require('deep-extend');
const nunjucks = require('../utils/nunjucks');
const { getObjectProperty, revHashObject } = require('../utils');
const { Secret } = require('./docker/secret');

// -- notes
// const pack = loadPack('foo/bar');
// const release = new Release({ pack, 'prod', values });
// Release has rendered automatically?
//
// -- /notes

class Release {
  /**
   * @param {Pack} pack
   * @param {string} stack
   * @param {Object} values
   */
  constructor({ pack, stack, values }) {
    this.template = pack.template;
    this.stack = stack;
    this.values = deepExtend({}, pack.defaults, values);
    this.pack = pack;
  }

  compile() {
    const nj = nunjucks(this.pack);
    this.secrets = [];
    /**
     * @param {Object} opts - set extra options on secret
     *   base64: true - means this value is already base64 encoded, no need to double encode it later
     */
    nj.addGlobal('secret_from_value', (key, opts) => {
      const value = getObjectProperty(key, this.values);
      const secret = new Secret({
        name: key,
        value,
        stack: this.stack,
        pack: this.pack.metadata.name,
        ...opts
      });
      this.secrets.push(secret);
      return secret.deployName;
    });

    nj.addGlobal('secret', (name, value, opts) => {
      const secret = new Secret({ name, value, ...opts });
      this.secrets.push(secret);
      return secret.deployName;
    });

    try {
      this.dockerComposeObject = yaml.safeLoad(
        nj.renderString(this.template, this.values)
      );
    } catch (e) {
      console.log('Error parsing compiled docker-compose.yml');
      console.log(e);
      process.exit(1); // TODO - not compatible with npm module mode (CLI only) - needs improvement
    }

    // Add top-level secrets for any service secrets we processed (e.g. with secret_from_value)
    this.dockerComposeObject.secrets = this.secrets.reduce(
      (obj, secret) => ({ [secret.deployName]: { external: true }, ...obj }),
      this.dockerComposeObject.secrets || {}
    );

    // Add swarm-pack service lables
    // TODO - allow passing extra labels from e.g. swarm-sync
    for (const definition of Object.values(this.dockerComposeObject.services)) {
      Object.assign(definition, {
        deploy: {
          labels: {
            'io.github.swarm-pack.pack.name': this.pack.metadata.name,
            'io.github.swarm-pack.pack.version': this.pack.metadata.version,
            'io.github.swarm-pack.release.digest': revHashObject(this),
            'com.docker.stack.namespace': this.stack
          }
        }
      });
    }
    this.compose = yaml.safeDump(this.dockerComposeObject);
    this.compiled = true;
  }
}

module.exports = {
  Release
};
