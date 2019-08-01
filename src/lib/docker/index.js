const docker = require('../../utils/docker');
const { deploySecret } = require('./secret');
const { deployToStack } = require('./service');
const { wait } = require('../../utils');

async function deployRelease({ release }) {
  const client = docker.getDockerodeClient();
  const { stack, pack } = release;
  await release.compile();

  for (const secret of release.secrets) {
    await deploySecret({ secret, pack: pack.metadata.name, stack });
  }
  await deployToStack(release);

  // Pause to avoid Docker weirdness when immediately accessing deployed objects
  await wait(2000);

  // Remove any Docker Secrets from old versions of this release
  // TODO - this used to remove services too but I removed it - can consider adding back if needed
  const releaseObjects = await findReleaseObjects({ stack, pack: pack.metadata.name });
  const deployedSecrets = release.secrets.map(s => s.deployName);

  for (secret of releaseObjects.secrets) {
    if (!deployedSecrets.includes(secret.name)) {
      await client.getSecret(secret.id).remove();
    }
  }
}

/**
 * Remove all release objects from Docker by pack name and stack
 */
async function removeRelease({ stack, pack }) {
  const client = docker.getDockerodeClient();
  if (!stack || !pack) {
    throw new Error('Removing a release requires valid stack & pack as a minimum');
  }
  const releaseObjects = await findReleaseObjects({ stack, pack });
  for (service of releaseObjects.services) {
    await client.getService(service.id).remove();
  }
  for (secret of releaseObjects.secrets) {
    await client.getSecret(secret.id).remove();
  }
}

/**
 * Get a list of docker objects (services, secrets) filtered on any or all of:
 *  pack name, pack version, stack and/or release digest
 *  returns {services: [{name, id}], secrets: [{name, id}]}
 */
async function findReleaseObjects({ pack, stack, version, digest }) {
  const client = await docker.getDockerodeClient();
  const filter = releaseLabelFilter({ pack, stack, version, digest });
  const resultMap = o => ({ id: o.ID, name: o.Spec.Name });

  const services = await client.listServices();
  const secrets = await client.listSecrets();
  return {
    services: services.filter(filter).map(resultMap),
    secrets: secrets.filter(filter).map(resultMap)
  };
}

/**
 * Generate filter function for Docker Objects based on release labels
 */
function releaseLabelFilter({ pack, stack, version, digest }) {
  return function(o) {
    console.log(`filter check for ${o.Spec.Name}`);
    if (pack && o.Spec.Labels['io.github.swarm-pack.pack.name'] !== pack) return false;
    if (version && o.Spec.Labels['io.github.swarm-pack.pack.version'] !== version)
      return false;
    if (digest && o.Spec.Labels['io.github.swarm-pack.release.digest'] !== digest)
      return false;
    if (stack && o.Spec.Labels['com.docker.stack.namespace'] !== stack) return false;
    return true;
  };
}

// async function remove({ name, stack }) {
//  const manifests = { name };
//  await cleanOutdatedService({ retainServices: [], manifests, stack });
//  await cleanSecret({ retainSecrets: [], manifests, stack });
// }

module.exports = {
  deployRelease,
  removeRelease,
  findReleaseObjects
};
