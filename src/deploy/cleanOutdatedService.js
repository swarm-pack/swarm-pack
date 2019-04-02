const docker = require('../services/docker');

async function removeService({ ID }) {
  return docker
    .getDockerodeClient()
    .getService(ID)
    .remove()
    .then(() => console.log(`Cleaned service ${ID}`));
}

async function cleanOutdatedServices({ manifests, stack, retainServices }) {
  docker
    .getDockerodeClient()
    .listServices()
    .then(result => {
      return result.filter(
        s =>
          s.Spec.Labels['pack.manifest.name'] === manifests.name &&
          s.Spec.Labels['com.docker.stack.namespace'] === stack
      );
    })
    .then(matchingServices => {
      function matchService(service, services) {
        return (
          services.findIndex(s => {
            return (
              (s.id && s.id.indexOf(service.ID) > -1) || s.name === service.Spec.Name
            );
          }) === -1
        );
      }

      return matchingServices.filter(service => matchService(service, retainServices));
    })
    .then(outdatedServices => {
      return Promise.all(outdatedServices.map(service => removeService(service))).catch(
        err => console.log(err)
      );
    });
}

module.exports = cleanOutdatedServices;
