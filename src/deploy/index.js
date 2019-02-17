const createSecret = require("./createSecret");
const deployToStack = require("./deployToStack");
const cleanSecret = require("./cleanSecret");
const cleanOutdatedService = require("./cleanOutdatedService");

async function deploy({ secrets, compose, manifests, stack }) {
  await Promise.all(secrets.map(s => createSecret(s, manifests, stack)))
  		.catch((err) => {
        console.log('Error creating secrets', err);
      });

  const deployedService = await deployToStack({ compose, stack });

  await cleanOutdatedService({ deployedService, manifests });
  await cleanSecret({ secrets, manifests });
}

module.exports = deploy;
