const Docker = require('dockerode');

let client = new Docker({ socketPath: '/var/run/docker.sock' });

function init(opts) {
  client = new Docker(opts);
}

module.exports = { client, init };
