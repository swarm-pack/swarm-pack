const path = require('path');
const simpleGit = require('simple-git/promise');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const md5 = require('md5');
const _ = require('lodash');
const config = require('../config').get();

async function cacheResolver({ name, url }) {
  let localPath;
  if (config.cacheDir) {
    localPath = path.join(config.cacheDir, `${name}_${md5(url)}`);
    await fs.ensureDir(localPath);
  } else {
    throw new Error("Cache dir doesn't exists");
  }

  return localPath;
}

/**
 * If config.cacheDir is set, clone the repo to the cache directory
 * Otherwise we'll clone it to a temporary directory
 *
 * Returns a complete path to the cloned/updated dir
 */
async function cloneOrPullRepo({ name, url }) {
  const localPath = await cacheResolver({ name, url });
  const git = simpleGit(localPath);
  if (await git.checkIsRepo()) {
    await git.pull();
  } else {
    await git.clone(url, localPath);
  }

  return localPath;
}

async function inspectPack(packRef) {
  let result = {};
  // Check if packRef is a local dir
  if (fs.pathExistsSync(path.resolve(packRef, 'packfile.yml'))) {
    result = {
      type: 'local',
      dir: path.resolve(packRef)
    };
    // Check if packRef looks like a repository configured in config.repositories
  } else if (
    packRef.split('/').length === 3 &&
    config.repositories.map(r => r.name).includes(packRef.split('/')[0])
  ) {
    const [repoName, repoDir, packDir] = packRef.split('/');
    const repoUrl = config.repositories.find(repo => repo.name === repoName).url;
    const localDir = await cloneOrPullRepo({ name: repoName, url: repoUrl });

    if (!fs.pathExistsSync(path.join(localDir, repoDir, packDir, 'packfile.yml'))) {
      throw new Error(
        `Cannot find ${repoDir}/${packDir}/packfile.yml in remote repo ${repoUrl}`
      );
    }
    result = {
      type: 'repository',
      dir: path.join(localDir, repoDir, packDir)
    };
  } else {
    throw new Error(`Couldn't resolve pack reference ${packRef}`);
  }

  // Get version from packfile
  result.packFile = yaml.safeLoad(
    await fs.readFile(path.resolve(result.dir, 'packfile.yml'))
  );
  result.version = result.packFile.pack.version;

  // If possible, get last git commit for this pack
  // This works for git urls and repo. Local dirs will work as long as they are initialized as git repos
  // This is outside the control of swarm-pack
  result.commit_hash = await simpleGit(result.dir)
    .log({ file: result.dir })
    .then(log => log.latest.hash)
    .catch(() => undefined);

  return result;
}

async function cacheUpdate() {
  if (config.cacheDir && !_.isEmpty(config.repositories)) {
    await Promise.all(
      config.repositories.map(async repo => {
        return cloneOrPullRepo(repo);
      })
    );
  }
}

async function validateRepo({ name, url }) {
  if (!name || !url) {
    throw new Error('Repository name or url are either missing or invalid');
  }

  if (config.repositories.find(r => r.name === name || r.url === url)) {
    throw new Error('Repository name or url already existed in config');
  }

  await cloneOrPullRepo({ name, url });
}

async function add({ name, url }) {
  await validateRepo({ name, url });
  config.repositories.push({ name, url });
  config.persist();
}

async function remove(repo) {
  const removeRepo = config.repositories.find(r => r.name === repo || r.url === repo);

  if (
    removeRepo.name === 'official' ||
    removeRepo.url === 'https://github.com/swarm-pack/repository'
  ) {
    throw new Error('Cannot remove official default repository');
  }

  if (!removeRepo) {
    return;
  }

  await fs.removeSync(await cacheResolver(removeRepo));
  config.repositories = [
    ...config.repositories.filter(r => r.name !== repo && r.url !== repo)
  ];

  config.persist();
}

async function list() {
  return config.repositories;
}

async function cacheClear() {
  if (config.cacheDir) {
    await fs.emptyDir(config.cacheDir);
  }
}

module.exports = { inspectPack, cacheClear, cacheUpdate, add, remove, list };
