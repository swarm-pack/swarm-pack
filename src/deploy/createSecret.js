const { Readable } = require("stream");
const { pipeToDocker, execDocker } = require("../utils/docker");

function createSecret({secret, manifests, stack}) {
  return new Promise(function(resolve, reject) {
    const { type, name, source } = secret;
    let rejected = false;
    const rejectOnce = (...args) => {
      if (!rejected) {
        rejected = true;
        reject(...args);
      }
    };

    if (type === 'string') {
      var s = new Readable();
      s.push(source);
      s.push(null);
    }

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
      console.log(`${data.toString()}`);
    };

    const onStderr = data => {
      console.log(`${data}`);
    };

    const args = [
      "secret", 
      "create",
      "--label",
      `pack.manifest.name=${manifests.name}`,
      "--label",
      `com.docker.stack.namespace=${stack}`,
      name
    ]

    if (type === 'string') {

      pipeToDocker(
        s,
        args.concat(['-']),
        onExit,
        onError,
        onStdout,
        onStderr
      )
    }else {
      execDocker(args.concat([source]),
        { env: process.env },
        (error, stdout, stderr) => {
          if (error) {
            onError(error);
          }else {
            console.log(stdout);
            onExit(0)
          }
        }
      );
    }

    
  });
}

module.exports = createSecret;
