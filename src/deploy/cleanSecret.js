const docker = require('../utils/docker');

async function removeSecret({ ID }) {
  return docker
    .getDockerodeClient()
    .getSecret(ID)
    .remove()
    .then(() => console.log(`Cleaned secret ${ID}`));
}

async function cleanSecrets({ secrets, manifests }) {
  docker
    .getDockerodeClient()
    .listSecrets()
    .then(result =>
      result.filter(
        secret => secret.Spec.Labels['pack.manifest.name'] === manifests.name
        // TODO - secrets need to be scoped to a stack
        // && secret.Spec.Labels['com.docker.stack.namespace'] === stack)
      )
    )
    .then(matchingSecrets =>
      matchingSecrets.filter(s => secrets.findIndex(ss => ss.name === s.Spec.Name) === -1)
    )
    .then(outdatedSecrets =>
      Promise.all(outdatedSecrets.map(secret => removeSecret(secret))).catch(err =>
        console.log(err)
      )
    );
}

module.exports = cleanSecrets;
