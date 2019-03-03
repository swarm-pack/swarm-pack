const path = require('path');
const isUrl = require('is-url');
const simpleGit = require('simple-git/promise');
const tmp = require('tmp');
const fs = require('fs-extra');
const yaml = require('js-yaml');

// TODO - move to configuration eventually
const gitRepoUrl = "https://github.com/swarm-pack/repository/";

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
  // Check if packRef is official repo
  } else if ( packRef.startsWith('stable/') || packRef.startsWith('incubator/') ) {
    // TODO - checkout in ~/.swarm-pack and pull to update when needed, i.e. a repo cache
    // N.B. need to figure out what to do when run as NPM package - probably different behaviour?
    await repo.env({ ...process.env }).clone(gitRepoUrl, 'repository')

    if (!fs.pathExistsSync(path.join(tempDir.name, 'repository', packRef, 'packfile.yml'))) {
      throw new Error(`Pack ${packRef} not found in official repository`);
    }

    result = {
      type: "official",
      dir: path.join(tempDir.name, 'repository', packRef)
    }

  // Check if packRef is a git url
  } else if ( isUrl(packRef) ) {
    try {
      await repo.env({ ...process.env }).clone(packRef, 'custom')
    }catch (err) {
      console.error(`Error cloning repository at URL ${packRef}`, err);
      process.exit(1);
    }
    result = {
      type: "git",
      dir: path.join(tempDir.name, 'custom')
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
