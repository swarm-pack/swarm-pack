const createSecret = require('./createSecret');
const deployToStack = require('./deployToStack');
const cleanSecret = require('./cleanSecret');
const cleanOutdatedService = require('./cleanOutdatedService');

async function deploy({ secrets, compose, manifests, stack }) {
  await Promise.all(
    secrets.map(secret => createSecret({ secret, manifests, stack }))
  ).catch(err => {
    console.log('Error creating secrets', err);
  });

  const deployedService = await deployToStack({ compose, stack });

  await cleanOutdatedService({ retainServices: deployedService, manifests, stack });
  await cleanSecret({ retainSecrets: secrets, manifests, stack });
}

async function remove({ name, stack }) {
  const manifests = { name };

  await cleanOutdatedService({ retainServices: [], manifests, stack });
  await cleanSecret({ retainSecrets: [], manifests, stack });
}

module.exports = {
  deploy,
  remove
};
