const yaml = require("js-yaml");
const cuid = require("cuid");
const _ = require("lodash");
const path = require('path');
const precompile = require("./precompile");
const postcompile = require("./postcompile");

function compile({ template, values, manifests, location }) {
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
      source = path.join(location, 'secrets', source)
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
    compose: parsed,
    manifests
  };
}

function index(loc) {
  const packloc = !path.isAbsolute(loc) ? path.resolve(loc) : loc;

  const preCompile = precompile(packloc);
  const compiled = compile(preCompile);
  const postCompiled = postcompile(compiled);
  return postCompiled;
}
module.exports = index;
