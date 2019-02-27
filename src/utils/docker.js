const Docker = require('dockerode');
const { spawn, execFile } = require('child_process');

let config = {
  socketPath: '/var/run/docker.sock',
  url: 'unix:///var/run/docker.sock'
};

function configure({ socketPath = false, host = false, port = '2375' }) {
  if (socketPath && host) {
    throw new Error('Cannot specify both socketPath & host in configuration.');
  }

  if (host && (host.includes(':') || host.includes('/'))) {
    throw new Error(
      'Unlike docker -H, host should be a hostname only. Use port (--port) to specify those separately.'
    );
  }

  if (host) {
    config = {
      host,
      port,
      url: `tcp://${host}:${port}`
    };
  } else if (socketPath) {
    config = {
      socketPath,
      url: `unix://${socketPath}`
    };
  }
}

function getDockerodeClient() {
  if (config.host) {
    return new Docker({
      host: config.host,
      port: config.port
    });
  }

  return new Docker({ socketPath: config.socketPath });
}

function getDockerArgs() {
  return ['-H', config.url];
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

function execDocker(args, opts, cb) {
  return execFile('docker', getDockerArgs().concat(args), opts, cb);
}

module.exports = {
  pipeableSpawn,
  execDocker,
  pipeToDocker,
  configure,
  getDockerodeClient
};
