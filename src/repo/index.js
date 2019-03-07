const path = require('path');
const isUrl = require('is-url');
const simpleGit = require('simple-git/promise');
const tmp = require('tmp');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const config = require('../config').get();

// TODO - move to configuration eventually

async function inspectPack(packRef) {
  const tempDir = tmp.dirSync();
  const repo = simpleGit(tempDir.name);

  let result = {}

  // Check if packRef is a local dir
  if ( fs.pathExistsSync(path.resolve(packRef, 'packfile.yml')) ) {
    result = {
      type: "local",
      dir: path.resolve(packRef)
    }
  // Check if packRef looks like a repository configured in config.repositories
  } else if (
      packRef.split("/").length === 3 &&
      config.repositories.map(r => r.name).includes(packRef.split("/")[0]) 
    ) {

    const [ repoName, repoDir, packDir ] = packRef.split("/");
    const repoUrl = config.repositories.find(repo => repo.name === repoName).url;

    // TODO - checkout in ~/.swarm-pack and pull to update when needed, i.e. a repo cache
    // N.B. need to figure out what to do when run as NPM package - probably different behaviour?
    await repo.env({ ...process.env }).clone(repoUrl, repoName)

    if (!fs.pathExistsSync(path.join(tempDir.name, repoName, repoDir, packDir, 'packfile.yml'))) {
      throw new Error(`Cannot find ${repoDir}/${packDir}/packfile.yml in remote repo ${repoUrl}`);
    }

    result = {
      type: "repository",
      dir: path.join(tempDir.name, repoName, repoDir, packDir)
    }

  } else { 
    throw new Error(`Couldn't resolve pack reference ${packRef}`);
  }

  // Get version from packfile
  result.packFile = yaml.safeLoad(await fs.readFile(path.resolve(result.dir, 'packfile.yml')));
  result.version = result.packFile.pack.version;

  // If possible, get last git commit for this pack
  // This works for git urls and repo. Local dirs will work as long as they are initialized as git repos
  // This is outside the control of swarm-pack
  repo.cwd(result.dir);
  result.commit_hash = await repo.log({ file: result.dir }).then(log => log.latest.hash).catch(() => undefined)

  return result;
}

module.exports = {
  inspectPack
}
