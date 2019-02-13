const { spawn } = require("child_process");
const { Readable } = require("stream");
const _ = require("lodash");
const { pipeToDocker } = require("../utils");

function deployToStack({ compose, stack }) {
  console.log("Start deploying");

  return new Promise(function(resolve, reject) {
    const updated = [];
    const created = [];

    async function registerUpdatedService(output) {
      updated.push(output);
    }

    async function registerCreatedService(output) {
      created.push(output);
    }

    var s = new Readable();
    s.push(compose);
    s.push(null);

    function onExit(code, signal) {
      if (code === 0) {
        let deployedContainer = updated
          .filter(d => !_.isEmpty(d))
          .map(d => {
            const dt = d
              .replace("Updating service ", "")
              .replace(" (id: ", ";")
              .replace(")", "")
              .replace("\n", "");
            const split = dt.split(";");
            return {
              name: split[0],
              id: split[1],
              type: "updated"
            };
          });

        deployedContainer = _.concat(
          deployedContainer,
          created
            .filter(d => !_.isEmpty(d))
            .map(d => {
              const dt = d.replace("Creating service ", "").replace("\n", "");
              return {
                name: dt,
                id: null,
                type: "created"
              };
            })
        );
        resolve(deployedContainer);
      } else {
        reject();
      }
    }

    function onError(error) {
      reject(error);
    }

    function onStdout(stdout) {
      if (stdout.toString().indexOf("Updating service") > -1) {
        return registerUpdatedService(`${stdout}`);
      } else {
        return registerCreatedService(`${stdout}`);
      }
    }

    function onStderr(data) {
      console.log(`${data}`);
    }

    pipeToDocker(
      s,
      ["stack", "deploy", "--compose-file", "-", stack],
      onExit,
      onError,
      onStdout,
      onStderr
    );
  });
}

module.exports = deployToStack;
