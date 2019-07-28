const yaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');
const deepExtend = require('deep-extend');
const { loadPack } = require('./lib/pack');
const { Release } = require('./lib/release');
const { deployRelease } = require('./lib/docker');

async function mergeValuesWithPackDefaults({ packRef, values = {} }) {
  const pack = await loadPack(packRef);
  return deepExtend({}, pack.defaults, values);
}

async function compileAndDeploy({ stack, packRef, values = {} }) {
  const pack = await loadPack({ packRef });
  const release = new Release({ pack, stack, values });
  await deployRelease({ release });
}

module.exports = {
  compileAndDeploy,
  mergeValuesWithPackDefaults
};
