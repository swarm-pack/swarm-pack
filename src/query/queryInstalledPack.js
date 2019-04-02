const _ = require('lodash');
// const { pipeToDocker } = require('../services/docker');
const docker = require('../services/docker');

async function queryInstalledPack() {
  const services = await docker.getDockerodeClient().listServices();

  return _.uniqWith(
    services.map(s => ({
      name: s.Spec.Labels['pack.manifest.name'],
      version: s.Spec.Labels['pack.manifest.version'],
      stack: s.Spec.Labels['com.docker.stack.namespace']
    })),
    _.isEqual
  );
}

module.exports = queryInstalledPack;
