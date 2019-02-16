const _ = require("lodash");
const docker = require('../services/docker');

async function removeSecret({ID}) {
  return docker.client.getSecret(ID)
    .remove()
    .then(data => console.log(`Cleaned secret ${ID}`))
}

async function cleanSecrets({ secrets, manifests, stack }) {

  docker.client.listSecrets()
    .then((result) => 
      result.filter((secret) => 
        secret.Spec.Labels['pack.manifest.name'] === manifests.name
        // TODO - secrets need to be scoped to a stack
         //&& secret.Spec.Labels['com.docker.stack.namespace'] === stack)
      )
    ).then((matchingSecrets) => 
      matchingSecrets.filter(s => secrets.findIndex(ss => ss.name === s.Spec.Name) === -1)
    ).then((outdatedSecrets) => 
      Promise.all(outdatedSecrets.map(secret => removeSecret(secret)))
        .catch((err) => console.log(err))
    )
}

module.exports = cleanSecrets;