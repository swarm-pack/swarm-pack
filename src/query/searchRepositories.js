const glob = require('glob');
const sanitize = require('sanitize-filename');
const yaml = require('js-yaml');
const { cacheUpdate } = require('../repo');
const config = require('../config').get();
const { readFile } = require('../utils');

function getPackfile(keyword) {
  const name = sanitize(keyword);
  return new Promise((resolve, reject) => {
    glob(`${config.cacheDir}/**/**${name}**/packfile.yml`, (err, files) =>
      err ? reject(err) : resolve(files)
    );
  });
}

async function searchRepositories(keyword) {
  await cacheUpdate();
  const packfiles = await getPackfile(keyword);
  const packs = await Promise.all(
    packfiles.map(async pf => {
      const doc = yaml.safeLoad(await readFile(pf));
      const pack = {
        name: doc.pack.name,
        version: doc.pack.version,
        description: doc.pack.description || '',
        packRef: pf
          .replace(config.cacheDir, '')
          .replace('/packfile.yml', '')
          .split('/')
          .map((v, i) => (i === 1 ? v.split('_')[0] : v)) // Remove MD5 hash
          .join('/')
      };

      return pack;
    })
  );

  return packs;
}

module.exports = searchRepositories;
