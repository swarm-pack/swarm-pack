const _ = require("lodash");
const { pipeToDocker } = require("../utils");

async function _queryService({ manifests }) {
  return new Promise((resolve, reject) => {
    let svcs = [];
    const onExit = (code, signal) => {
      if (code === 0) {
        resolve(svcs);
      } else {
        reject();
      }
    };

    const onError = err => {
      reject(err);
    };

    const onStdout = data => {
      svcs = data
        .toString()
        .split(",\n")
        .filter(s => !_.isEmpty(s))
        .map(s => ({ id: s.split(";")[0], name: s.split(";")[1] }));
    };

    const onStderr = data => {
      console.log(`${data}`);
    };

    pipeToDocker(
      null,
      [
        "service",
        "ls",
        "--filter",
        `label=pack.manifest.name=${manifests.name}`,
        "--format",
        "{{.ID}};{{.Name}},"
      ],
      onExit,
      onError,
      onStdout,
      onStderr
    );
  });
}

async function _cleanAService({ id }) {
  return new Promise((resolve, reject) => {
    const onExit = (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    };

    const onError = err => {
      reject(err);
    };

    const noOp = () => {};

    pipeToDocker(
      null,
      ["service", "rm", id],
      onExit,
      onError,
      noOp,
      noOp
    );
  });
}

async function cleanOutdatedService({ deployedService, manifests }) {
  const existingSvcs = await _queryService({ manifests });

  const outdatedSvcs = existingSvcs.filter(
    esvc =>
      deployedService.findIndex(
        dsvc =>
          (dsvc.id && dsvc.id.indexOf(esvc.id) > -1) || dsvc.name === esvc.name
      ) === -1
  );

  return Promise.all(outdatedSvcs.map(svc => _cleanAService(svc)))
          .catch((err) => console.log(err));
}

module.exports = cleanOutdatedService;
