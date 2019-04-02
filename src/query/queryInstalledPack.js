const _ = require('lodash');
// const { pipeToDocker } = require('../services/docker');
const docker = require('../services/docker');

async function queryInstalledPack() {
  const services = await docker.getDockerodeClient().listServices();

  return _.uniqWith(
    services.map(s => ({
      name: s.Spec.Labels['pack.manifest.name'],
      version: s.Spec.Labels['pack.manifest.version'],
      stack: s.Spec.Labels['com.docker.stack.namespace']
    })),
    _.isEqual
  );
  // return new Promise((resolve, reject) => {
  //   let packs = [];
  //   // eslint-disable-next-line no-unused-vars
  //   const onExit = (code, signal) => {
  //     if (code === 0) {
  //       resolve(packs);
  //     } else {
  //       reject();
  //     }
  //   };

  //   const onError = err => reject(err);

  //   const onStderr = data => console.log(`${data}`);

  //   const onStdout = data => {
  //     // console.log(`${data}`);
  //     // console.log(
  //     packs = data
  //       .toString()
  //       .split('\n')
  //       .map(s => s.split(',').filter(l => l.indexOf('pack.manifest') > -1))
  //       .filter(s => !_.isEmpty(s))
  //       .map(labelArr => {
  //         const label = {};
  //         labelArr.forEach(l => {
  //           if (l.indexOf('pack.manifest.name=') > -1) {
  //             // eslint-disable-next-line prefer-destructuring
  //             label.name = l.split('=')[1];
  //           }

  //           if (l.indexOf('pack.manifest.version=') > -1) {
  //             // eslint-disable-next-line prefer-destructuring
  //             label.version = l.split('=')[1];
  //           }
  //         });

  //         return label;
  //       });

  //     packs = _.uniqWith(packs, _.isEqual);
  //   };

  //   pipeToDocker(null, ['ps', '--format', '{{.Labels}}'], onExit, onError, onStdout, onStderr);
  // });
}

module.exports = queryInstalledPack;
