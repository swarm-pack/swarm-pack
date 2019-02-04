const { Readable } = require("stream");
const toString = require("stream-to-string");
const { pipeableSpawn } = require("../utils");

function _querySecrets({ secrets, manifests }) {
  return new Promise((resolve, reject) => {
    const s = new Readable();
    s._read = function() {};
    s.push("[");
    onExit = async (code, signal) => {
      if (code === 0) {
        s.push(null);
        const tempString = await toString(s);
        const oldSecrets = JSON.parse(
          tempString.substr(0, tempString.length - 2) + "]"
        )
          .filter(s => s.name.indexOf(`pack__${manifests.name}__`) > -1)
          .filter(s => secrets.findIndex(ss => ss.name === s.name) === -1);
        resolve(oldSecrets);
      } else {
        reject();
      }
    };

    onError = error => {
      reject(error);
    };

    onStdout = data => {
      s.push(data);
    };

    onStderr = data => {
      console.log(`stderr: ${data}`);
    };

    pipeableSpawn(
      null,
      "docker",
      ["secret", "ls", "--format", '{"id": "{{.ID}}", "name": "{{.Name}}"},'],
      onExit,
      onError,
      onStdout,
      onStderr
    );
  });
}

async function _cleanASecret(secret) {
  return new Promise((resolve, reject) => {
    onExit = async (code, signal) => {
      if (code === 0) {
        console.log(`Secret ${secret.name} cleaned`);
        resolve();
      } else {
        reject();
      }
    };

    onError = error => {
      reject(error);
    };

    onNoop = () => {};
    console.log(`Cleaning secret ${secret.name}`);
    pipeableSpawn(
      null,
      "docker",
      ["secret", "rm", secret.id],
      onExit,
      onError,
      onNoop,
      onNoop
    );
  });
}

async function _cleanSecret(secrets) {
  return await Promise.all(secrets.map(s => _cleanASecret(s)));
}

async function cleanSecrets({ secrets, manifests }) {
  const s = await _querySecrets({ secrets,  manifests});
  return await _cleanSecret(s);
}

module.exports = cleanSecrets;
