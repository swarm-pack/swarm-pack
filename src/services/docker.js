const Docker = require('dockerode');
const config = require('../config').get();
const { pipeableSpawn } = require('../utils');

function getDockerodeClient() {
  if (config.docker.host) {
    return new Docker({
      host: config.docker.host,
      port: config.docker.port
    });
  }

  return new Docker({ socketPath: config.docker.socketPath });
}

function getDockerArgs() {
  return ['-H', config.docker.url];
}

function pipeToDocker(stream, args, onExit, onError, onStdout, onStderr) {
  return pipeableSpawn(
    stream,
    'docker',
    getDockerArgs().concat(args),
    onExit,
    onError,
    onStdout,
    onStderr
  );
}

module.exports = {
  pipeToDocker,
  getDockerodeClient
};
