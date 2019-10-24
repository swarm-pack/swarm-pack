const deepExtend = require('deep-extend');
const { loadPack } = require('./lib/pack');
const { Release } = require('./lib/release');
const { deployRelease } = require('./lib/docker');

async function mergeValuesWithPackDefaults({ packRef, values = {} }) {
  const pack = await loadPack(packRef);
  return deepExtend({}, pack.defaults, values);
}

async function compileAndDeploy({ stack, packRef, version, values = {} }) {
  const pack = await loadPack({ packRef, version });
  const release = new Release({ pack, stack, values });
  await deployRelease({ release });
}

async function inspectPack(packRef) {
  return loadPack(packRef);
}

module.exports = {
  compileAndDeploy,
  mergeValuesWithPackDefaults,
  inspectPack
};
