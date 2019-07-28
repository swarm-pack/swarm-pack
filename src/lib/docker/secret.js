const docker = require('../../utils/docker');
const { revHashStr, stringToBase64 } = require('../../utils');

class Secret {
  constructor({ name, value, stack, base64 = false }) {
    this.humanName = name;
    this.deployName = generateSecretName({ name, value, stack });
    this.value = base64 ? value : stringToBase64(value);
  }
}

/**
 * Creates a unique, deterministic name for a Docker Secret
 * Based on a hash of the value & trimmed to acceptible length
 */
function generateSecretName({ stack, name, value }) {
  return [
    stack.replace(/ /g, '_').substr(0, 15),
    name.replace(/ /g, '_').substr(0, 31),
    revHashStr(value)
  ].join('_');
}

/**
 * Deploy a Secret associated to a pack & stack
 */
async function deploySecret({ secret, pack, stack }) {
  const client = docker.getDockerodeClient();
  try {
    await client.createSecret({
      Name: secret.deployName,
      Labels: {
        'io.github.swarm-pack.pack.name': pack,
        'com.docker.stack.namespace': stack
      },
      Data: secret.value
    });
    console.log(`Created secret ${secret.deployName}`);
  } catch (e) {
    if (e.statusCode === 409) {
      console.log(`Secret ${secret.deployName} already exists & will be reused.`);
    } else {
      throw e;
    }
  }
}

async function removeOldSecrets({ newSecrets, pack, stack }) {
  const deployedSecrets = await docker.getDockerodeClient().listSecrets();
  const oldSecrets = deployedSecrets.filter(
    secret =>
      secret.Spec.Labels['io.github.swarm-pack.pack.name'] === pack &&
      secret.Spec.Labels['com.docker.stack.namespace'] === stack &&
      newSecrets.findIndex(ss => ss.name === s.Spec.Name) === -1
  );
  for (const oldSecret of oldSecrets) {
    try {
      await removeSecret(oldSecret);
    } catch (e) {
      console.log(e);
    }
  }
}

async function removeSecret({ ID }) {
  return docker
    .getDockerodeClient()
    .getSecret(ID)
    .remove()
    .then(() => console.log(`Cleaned secret ${ID}`));
}

module.exports = {
  removeOldSecrets,
  deploySecret,
  Secret
};
