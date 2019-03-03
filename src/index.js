const yaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');
const isUrl = require('is-url');
const simpleGit = require('simple-git/promise');
const tmp = require('tmp');
const compile = require('./compile/compile');
const deploy = require('./deploy');
const docker = require('./utils/docker');

// TODO - move to configuration eventually
const gitRepoUrl = "https://github.com/swarm-pack/repository/";

async function compileAndDeploy({
  stack,
  packRef = process.cwd(),
  values = {},
  dockerConfig = false
}) {
  // Config passed to method
  if (dockerConfig) {
    docker.configure({ ...dockerConfig });
  }

  const tempDir = tmp.dirSync();
  const repo = simpleGit(tempDir.name);

  let packDir;

  // Check if packRef is a local dir
  if ( fs.pathExistsSync(path.resolve(packRef, 'packfile.yml')) ) {
    packDir = path.resolve(packRef);
    console.log(`Found packfile at ${path.join(packDir,'/packfile.yml')}`);

  // Check if packRef is official repo
  } else if ( packRef.startsWith('stable/') || packRef.startsWith('incubator/') ) {
    console.log(`Checking repository for pack...`)

    // TODO - checkout in ~/.swarm-pack and pull to update when needed, i.e. a repo cache
    // N.B. need to figure out what to do when run as NPM package - probably different behaviour?

    await repo.env({ ...process.env }).clone(gitRepoUrl, 'repository')
    packDir = path.join(tempDir.name, 'repository', packRef);

    if (!fs.pathExistsSync(path.resolve(packDir, 'packfile.yml'))) {
      throw new Error(`Pack ${packRef} not found in official repository`);
    }
  // Check if packRef is a git url
  } else if ( isUrl(packRef) ) {
    try {
      await repo.env({ ...process.env }).clone(packRef, 'custom')
    }catch (err) {
      console.error(`Error cloning repository at URL ${packRef}`, err);
      process.exit(1);
    }
    packDir = path.join(tempDir.name, 'custom');

  } else { 
     throw new Error(`Couldn't resolve pack reference ${packRef}`);
  }

  // Required files
  const packContent = yaml.safeLoad(await fs.readFile(path.resolve(packDir, 'packfile.yml')));
  const template = (await fs.readFile(path.resolve(packDir, 'docker-compose.tpl.yml'))).toString('utf8');

  // Optional files
  const defaults = yaml.safeLoad(
    await fs.readFile(path.resolve(packDir, 'defaults.yml')).catch(() => '')
  );

  const newValues = Object.assign({}, defaults, values);

  return deploy(
    compile({
      manifests: packContent.pack,
      packDir,
      template,
      values: newValues,
      stack
    })
  );
}

module.exports = {
  compileAndDeploy,
  compile,
  deploy
};
