const Docker = require('dockerode');
const { spawn } = require('child_process');
const config = require('../config').get();

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

function pipeableSpawn(stream, command, args, onExit, onError, onStdout, onStderr) {
  const child = spawn(command, args, { env: process.env });
  if (stream) {
    stream.pipe(child.stdin);
  }

  child.on('exit', (code, signal) => {
    if (onExit) {
      onExit(code, signal);
    } else {
      console.log(`Process exited with code ${code} and signal ${signal}`);
    }
  });

  child.on('error', err => {
    if (onError) {
      onError(err);
    } else {
      console.log(`Process exited with error ${err}`);
    }
  });

  child.stdout.on('data', data => {
    if (onStdout) {
      onStdout(data);
    } else {
      console.log(`Process stdout:\n${data}`);
    }
  });

  child.stderr.on('data', data => {
    if (onStderr) {
      onStderr(data);
    } else {
      console.log(`Process stderr:\n${data}`);
    }
  });
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
