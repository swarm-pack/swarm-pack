const yaml = require("js-yaml");
const cuid = require("cuid");
const _ = require("lodash");
const precompile = require("./precompile");
const postcompile = require("./postcompile");

function compile({ template, values, secrets, manifests }) {
  const nunjucks = require("nunjucks");
  const env = nunjucks.configure({ autoescape: true });
  env.addGlobal("external_secret", externalSecret);

  let secretReg = [];
  let allSecrets;
  function externalSecret(secret_name) {
    if (allSecrets.findIndex(s => s.name === secret_name) !== -1) {
      const secretName = `pack__${
        manifests.name
      }__${secret_name}__${cuid.slug()}`;

      secretReg.push({
        name: secretName,
        sType: "external",
        value:
          allSecrets[allSecrets.findIndex(s => s.name === secret_name)].value
      });

      return secretName;
    }
  }

  allSecrets = secrets;
  const interpolatedTpl = nunjucks.renderString(template, values);

  const parsed = yaml.safeLoad(interpolatedTpl);

  if (secretReg.length > 0) {
    const existingSecrets = parsed.secrets || {};

    const genSecrets = secretReg.reduce((p, s) => {
      const ps = Object.assign({}, p, { [s.name]: { [s.sType]: true } });
      return ps;
    }, existingSecrets);

    parsed.secrets = Object.assign({}, genSecrets);
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
    secrets: secretReg,
    compose: parsed,
    manifests
  };
}

function index() {
  const preCompile = precompile(__dirname + "/../../pack");
  const compiled = compile(preCompile);
  const postCompiled = postcompile(compiled);
  return postCompiled;
}
module.exports = index;
