const fs = require('fs');
const docker = require('../utils/docker');

function formatSecretData({ type, source }) {
  if (type === 'file') {
    return fs.readFileSync(source).toString('base64');
  }
  // Default to type === 'string'
  return Buffer.from(source, 'utf8').toString('base64');
}

function createSecret({ secret, manifests, stack }) {
  return docker
    .getDockerodeClient()
    .createSecret({
      Name: secret.name,
      Labels: {
        'pack.manifest.name': manifests.name,
        'com.docker.stack.namespace': stack
      },
      Data: formatSecretData(secret)
    })
    .then(() => {
      console.log(`Created secret ${secret.name}`);
    });
}

module.exports = createSecret;
