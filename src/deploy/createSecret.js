const { Readable } = require("stream");
const { pipeableSpawn } = require("../utils");

function createSecret(secret, manifests) {
  return new Promise(function(resolve, reject) {
    const { name, value } = secret;
    let rejected = false;
    const rejectOnce = (...args) => {
      if (!rejected) {
        rejected = true;
        reject(...args);
      }
    };

    var s = new Readable();
    s.push(value);
    s.push(null);

    console.log(`Creating secret ${name}`);

    const onExit = (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        rejectOnce();
      }
    };

    const onError = err => {
      rejectOnce(err);
    };

    const onStdout = data => {
      console.log(`${data}`);
    };

    const onStderr = data => {
      console.log(`${data}`);
    };

    pipeableSpawn(
      s,
      "docker",
      ["secret", "create", "--label", `pack.manifest.name=${manifests.name}`,name, "-"],
      onExit,
      onError,
      onStdout,
      onStderr
    );
  });
}

module.exports = createSecret;
