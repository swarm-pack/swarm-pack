const createSecret = require("./createSecret");
const deployToStack = require("./deployToStack");
const cleanSecret = require("./cleanSecret");
const cleanOutdatedService = require("./cleanOutdatedService");

async function deploy({ secrets, compose, manifests, stack }) {
  await Promise.all(secrets.map(secret => createSecret({secret, manifests, stack})))
  		.catch((err) => {
        console.log('Error creating secrets', err);
      });

  const deployedService = await deployToStack({ compose, stack });

  await cleanOutdatedService({ deployedService, manifests, stack });
  await cleanSecret({ secrets, manifests, stack });
}

module.exports = deploy;
