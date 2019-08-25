const docker = require('../../utils/docker');
const spawn = require('../../utils/spawn-promise');

function deployToStack({ compose, stack }) {
  return spawn(
    'docker',
    ['stack', 'deploy', '--with-registry-auth', '--compose-file', '-', stack],
    compose
  )
    .then(stdOutLines => {
      const changedServices = [];

      for (const l of stdOutLines) {
        const updateMatch = /^Updating service (?<name>[a-zA-Z0-9_-]*) \(id: (?<id>[a-zA-Z0-9]*)\)$/.exec(
          l
        );
        if (updateMatch && updateMatch.groups.name && updateMatch.groups.id) {
          changedServices.push({ type: 'updated', ...updateMatch.groups });
        }
        const createMatch = /^Creating service (?<name>[a-zA-Z0-9_-]*)$/.exec(l);
        if (createMatch && createMatch.groups.name && createMatch.groups.id) {
          changedServices.push({ type: 'created', ...createMatch.groups });
        }
      }
      return changedServices;
    })
    .catch(e => {
      console.log('Error deploying stack');
      console.log(e);
    });
}

async function queryInstalledPack() {
  const services = await docker.getDockerodeClient().listServices();
  return services
    .filter(s => s.Spec.Labels['io.github.swarm-pack.pack.name'])
    .map(s => ({
      name: s.Spec.Labels['io.github.swarm-pack.pack.name'],
      stack: s.Spec.Labels['com.docker.stack.namespace'],
      version: s.Spec.Labels['io.github.swarm-pack.pack.version']
    }));
}

/**
 * TODO - not sure if we keep this
 * Either way needs documentation
 */
// async function cleanOutdatedServices({ manifests, stack, retainServices }) {
//  docker
//    .getDockerodeClient()
//    .listServices()
//    .then(result => {
//      return result.filter(
//        s =>
//          s.Spec.Labels['pack.manifest.name'] === manifests.name &&
//          s.Spec.Labels['com.docker.stack.namespace'] === stack
//      );
//    })
//    .then(matchingServices => {
//      function matchService(service, services) {
//        return (
//          services.findIndex(s => {
//            return (
//              (s.id && s.id.indexOf(service.ID) > -1) || s.name === service.Spec.Name
//            );
//          }) === -1
//        );
//      }
//      return matchingServices.filter(service => matchService(service, retainServices));
//    })
//    .then(outdatedServices => {
//      return Promise.all(outdatedServices.map(service => removeService(service))).catch(
//        err => console.log(err)
//      );
//    });
// }

module.exports = {
  queryInstalledPack,
  deployToStack
};
