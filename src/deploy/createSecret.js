const docker = require('../services/docker');

async function createSecret({ secret, manifests, stack }) {
  const client = docker.getDockerodeClient();
  const data = secret.base64
    ? secret.value
    : Buffer.from(secret.value, 'utf8').toString('base64');

  try {
    await client.createSecret({
      Name: secret.name,
      Labels: {
        'pack.manifest.name': manifests.name,
        'com.docker.stack.namespace': stack
      },
      Data: data
    });
    console.log(`Created secret ${secret.name}`);
  } catch (error) {
    if (error.statusCode === 409) {
      console.log(`Secret ${secret.name} already exists & will be reused.`);
    } else {
      throw error;
    }
  }
}

module.exports = createSecret;
