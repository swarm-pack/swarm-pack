const fs = require('fs-extra');
const { spawn } = require('child_process');

/**
 * Get a property of a (nested) object using a dot-notation string
 * E.g. getObjectProperty("foo.bar", {foo: {bar: "baz"}})
 *  returns "baz"
 */
function getObjectProperty(property, object) {
  return property.split('.').reduce((o, i) => o[i], object);
}

function readFile(fileName, type = 'utf-8') {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, type, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

function ensurePathExisted(path, isDir = false) {
  if (isDir) {
    fs.ensureDirSync(path);
  } else {
    fs.ensureFileSync(path);
  }
}

function isFileEmpty(path) {
  if (!fs.pathExistsSync(path)) {
    throw new Error(`${path} is not existed`);
  }

  return fs.statSync(path).size === 0;
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

module.exports = {
  getObjectProperty,
  readFile,
  ensurePathExisted,
  pipeableSpawn,
  isFileEmpty
};
