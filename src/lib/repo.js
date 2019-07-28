const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const { satisfies, compare } = require('semver');
const got = require('got');
const walk = require('klaw');
const _ = require('lodash');
const semver = require('semver');
const config = require('../config').get();
const { revHashFileSync, revHashStr } = require('../utils');

class Repo {
  constructor({ name, url }) {
    this.name = name;
    this.url = url;
  }

  async getEntries() {
    try {
      return yaml.safeLoad(
        await fs.readFile(path.join(await cacheResolver(this), 'index.yml'))
      ).entries;
    } catch (e) {
      console.log(e);
      throw new Error(
        `Failed to get index for repo ${this.name} - try swarm-pack repo update`
      );
    }
  }

  // Get latest entry for pack by name, with optional version or semver pattern
  // If nothing matches, returns false
  async getPackEntry({ pack, version = '>0.0.0' }) {
    const entries = await this.getEntries();
    const entry = entries
      .filter(e => e.name === pack && satisfies(e.version, version))
      .reduce(
        (curr, e) => (curr ? (compare(e.version, curr.version) > 0 ? e : curr) : e),
        false
      );

    if (entry) {
      entry.cachePath = path.join(
        await cacheResolver(this),
        `${entry.name}-${entry.version}.tgz`
      );
    }

    return entry;
  }

  async getCacheDir() {
    return cacheResolver(this);
  }
}

/**
 * Loads an index.yml from URL or path to file
 * Returns unmarshaled object from the yaml
 */
async function loadIndexFile(location) {
  if (location.startsWith('http://') || location.startsWith('https://')) {
    return got(location).then(response => yaml.safeLoad(response.body));
  }
  return yaml.safeLoad(await fs.readFile(path.resolve(location)));
}

/**
 * Does the named repo exist in config.repositories
 */
async function repoExists(name) {
  return config.repositories.map(r => r.name).includes(name);
}

/**
 * If config.cacheDir, path to repo is function of name & hashed url, appended to config.cacheDir
 * Otherwise, it will be a tempdir
 */
async function cacheResolver({ name, url }) {
  let localPath;
  if (config.cacheDir) {
    localPath = path.join(config.cacheDir, `${name}_${revHashStr(url)}`);
    await fs.ensureDir(localPath);
  } else {
    localPath = tmp.dirSync().name;
  }
  return localPath;
}

/**
 * Parse a pack bundle filename, e.g. nginx-1.1.1.tgz
 * Returns { name, version }
 */
function parsePackBundleName(filename) {
  const regexpResult = /^(?<name>.*)-(?<version>\d+\.\d+\.\d+-*\w*)(:?.tgz)*$/.exec(
    filename
  );
  const { name, version } = regexpResult.groups;
  if (!semver.valid(version)) {
    throw Error(`Invalid filename (could not parse version ${version})`);
  }
  return { name, version };
}

/**
 * Generate index.yml in current directory containing pack bundle files
 */
async function generateIndex({ baseUrl }) {
  return new Promise((resolve, reject) => {
    const entries = [];
    walk(process.cwd())
      .on('data', item => {
        if (path.extname(item.path) === '.tgz') {
          const { name, version } = parsePackBundleName(path.basename(item.path));
          const entry = {
            name,
            version,
            urls: [`${baseUrl}/${path.basename(item.path)}`],
            digest: revHashFileSync(item.path)
          };
          entries.push(entry);
        }
      })
      .on('end', () => resolve({ entries }));
  });
}

/**
 * Get path to pack from repo cache (download to cache if needed)
 * repoName - name of repo in configuration
 * pack - name of the pack in the repo
 * version - optional version or semver pattern, e.g. 1.0.0 or ^1.2.0
 *
 * Returns path to pack file in cache
 */
async function getRepoPack({ repoName, pack, version }) {
  const repo = new Repo(config.repositories.find(repo => repo.name === repoName)); // .reduce(repo => repo.url);
  const targetSemver = version || '>0.0.0';
  const packEntry = await repo.getPackEntry({ pack, version });

  if (!packEntry) {
    throw new Error(
      `Cannot find pack ${pack} in repo ${repoName}. Try swarm-pack update`
    );
  }

  // TODO - Check cache for matching file first
  if (
    fs.pathExistsSync(packEntry.cachePath) &&
    revHashFileSync(packEntry.cachePath) === packEntry.digest
  ) {
    return packEntry.cachePath;
  }

  try {
    await got(packEntry.urls[0], {
      encoding: null,
      decompress: false
    }).then(response => fs.writeFile(packEntry.cachePath, response.body));
  } catch (e) {
    throw new Error(`Error downloading pack ${packEntry.name}. Try swarm-pack update`);
  }

  return packEntry.cachePath;
}

async function addRepo({ name, url }) {
  if (!name || !url) {
    throw new Error('Repository name or url are either missing or invalid');
  }

  if (config.repositories.find(r => r.name === name || r.url === url)) {
    throw new Error('Repository name or url already existed in config');
  }

  await updateRepo({ name, url });
  config.repositories.push({ name, url });
  config.persist();
}

/**
 * Iterate over configured repos and update the index.yml
 */
async function updateAllRepos() {
  if (config.cacheDir && !_.isEmpty(config.repositories)) {
    for (const repo of config.repositories) {
      await updateRepo(repo);
    }
  }
}

/**
 * If config.cacheDir is set, clone the repo to the cache directory
 * Otherwise we'll clone it to a temporary directory
 *
 * Returns a complete path to the cloned/updated dir
 */
async function updateRepo({ name, url }) {
  const localPath = await cacheResolver({ name, url });
  try {
    const indexyml = await got(`${url}/index.yml`).then(response => response.body);
    await fs.writeFile(path.join(localPath, 'index.yml'), indexyml);
  } catch (e) {
    throw new Error(`Failed updating repo ${name}`);
  }
  return localPath;
}

async function removeRepo(ref) {
  const { name, url } = config.repositories.find(r => r.name === ref || r.url === ref);
  if (!name || !url) return;
  const repo = new Repo({ name, url });

  if (repo.name === 'official')
    throw new Error('Cannot remove official default repository');

  await fs.removeSync(await repo.getCacheDir());
  config.repositories = [
    ...config.repositories.filter(r => r.name !== repo.name && r.url !== repo.url)
  ];
  config.persist();
}

async function indexRepo({ baseUrl = '', mergeWith = false }) {
  generateIndex({ baseUrl }).then(index => {
    if (mergeWith) {
      const mergeIndex = loadIndexFile(mergeWith);
      mergeIndex.entries.forEach(mergeEntry => {
        const dupe = index.entries.find(entry => {
          return entry.name === mergeEntry.name && entry.version === mergeEntry.version;
        });
        // Add mergeEntry if not dupe of local entry
        if (!dupe) index.entries.push(mergeEntry);
      });
    }

    index.entries.sort((a, b) => a.name - b.name || semver.compare(a.version, b.version));

    if (index.entries.length > 0) {
      fs.writeFileSync(path.join(process.cwd(), 'index.yml'), yaml.safeDump(index));
    }
  });
}

module.exports = {
  getRepoPack,
  repoExists,
  addRepo,
  removeRepo,
  updateAllRepos,
  loadIndexFile
};
