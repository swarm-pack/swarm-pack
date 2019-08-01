const Docker = require('dockerode');
const config = require('../config');

function getDockerodeClient() {
  if (config.docker.host) {
    return new Docker({
      host: config.docker.host,
      port: config.docker.port
    });
  }

  return new Docker({ socketPath: config.docker.socketPath });
}

module.exports = {
  getDockerodeClient
};
