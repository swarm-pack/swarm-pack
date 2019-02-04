const createSecret = require("./createSecret");
const deployToStack = require("./deployToStack");
const cleanSecret = require("./cleanSecret");
const cleanOutdatedService = require("./cleanOutdatedService");

async function deploy({ secrets, compose, manifests }) {
  await Promise.all(secrets.map(createSecret));

  const deployedService = await deployToStack({ compose });

  await cleanOutdatedService({ deployedService, manifests });
  await cleanSecret({ secrets, manifests });
}

module.exports = deploy;
