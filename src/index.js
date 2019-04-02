const yaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');
const deepExtend = require('deep-extend');
const compile = require('./compile/compile');
const { deploy, remove } = require('./deploy');
const { inspectPack } = require('./repo');
const { searchRepositories, queryInstalledPack } = require('./query');

async function compileAndDeploy({ stack, packRef, values = {} }) {
  const pack = await inspectPack(packRef);

  // Required files
  const template = (await fs.readFile(
    path.join(pack.dir, 'docker-compose.tpl.yml')
  )).toString('utf8');

  // Optional files
  const defaultsStr = await fs
    .readFile(path.join(pack.dir, 'defaults.yml'))
    .catch(() => '');
  let defaults;
  try {
    defaults = yaml.safeLoad(defaultsStr);
  } catch (error) {
    console.log('Error parsing defaults.yml');
    console.log(error.reason);
    console.log(defaultsStr);
    process.exit(1);
  }

  const newValues = deepExtend({}, defaults, values);

  return deploy(
    compile({
      manifests: pack.packFile.pack,
      packDir: pack.dir,
      template,
      values: newValues,
      stack
    })
  );
}

/**
 * Supper rough implementation
 * Still need to keep track of current secret
 * Questions:
 * - How to scope it in to certain stack?
 * - Semver pattern ?
 * - How do I track if I deployed a pack from my repo not in public repo?
 * @param {*} pack
 */
async function upgrade(pack) {
  let installedPacks = await queryInstalledPack();

  if (typeof pack === 'string') {
    installedPacks = installedPacks.filter(ip => ip.name === pack);
  }

  return Promise.all(
    installedPacks.map(async ip => {
      let availablePacks = await searchRepositories(ip.name);

      availablePacks = availablePacks.sort((a, b) => (a.version <= b.version ? 1 : -1));

      const isUpgrade = availablePacks[0].version > ip.version;

      if (isUpgrade) {
        return compileAndDeploy({ stack: ip.stack, packRef: availablePacks[0].packRef });
      }
      return Promise.resolve();
    })
  );
}

module.exports = {
  compileAndDeploy,
  compile,
  deploy,
  remove,
  inspectPack,
  searchRepositories,
  upgrade
};
