const { Readable } = require("stream");
const toString = require("stream-to-string");
const { pipeToDocker, execDocker } = require("../utils/docker");

function _querySecrets({ secrets, manifests }) {
  return new Promise((resolve, reject) => {
    execDocker(
      [
        "secret",
        "ls",
        "--filter",
        `label=pack.manifest.name=${manifests.name}`,
        "--format",
        '{"id": "{{.ID}}", "name": "{{.Name}}"},'
      ], { env: process.env },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr));
        }else {
          
          const oldSecrets = JSON.parse('['+
          (stdout.length > 2
              ? stdout.substr(0, stdout.length - 2)
              : stdout) + "]"
          ).filter(s => secrets.findIndex(ss => ss.name === s.name) === -1);

          resolve(oldSecrets);
        }
      }
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
        reject(new Error(`Error cleaning secret ${secret.name}`));
      }
    };

    onError = error => {
      reject(error);
    };

    onNoop = () => {};
    console.log(`Cleaning secret ${secret.name}`);
    pipeToDocker(
      null,
      ["secret", "rm", secret.id],
      onExit,
      onError,
      onNoop,
      onNoop
    );
  });
}

async function _cleanSecret(secrets) {
  return await Promise.all(secrets.map(s => _cleanASecret(s)))
                .catch((err) => {
                  console.log('Error cleaning secrets', err);
                })
}

async function cleanSecrets({ secrets, manifests }) {
  const s = await _querySecrets({ secrets, manifests });
  return await _cleanSecret(s);
}

module.exports = cleanSecrets;
