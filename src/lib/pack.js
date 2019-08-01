const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const tarStream = require('tar-stream');
const tar = require('tar');
const gunzip = require('gunzip-maybe');
const toString = require('stream-to-string');
const walk = require('klaw');
const { getRepoPack, repoExists } = require('./repo');

// Pack object loaded from file or dir
class Pack {
  constructor() {
    this.otherTemplates = {};
  }

  getTemplate(name) {
    return this.otherTemplates[name];
  }

  addResource({ name, data }) {
    switch (name) {
      case 'packfile.yml':
        this.metadata = yaml.safeLoad(data).pack;
        break;

      case 'defaults.yml':
        this.defaults = yaml.safeLoad(data);
        break;

      case 'docker-compose.tpl.yml':
        this.template = data;
        break;

      default:
        // Other templates
        if (path.extname(name) === '.tpl') {
          this.otherTemplates[name.replace(/\.tpl$/, '')] = data;
        }
        break;
    }
  }
}

/**
 * Load a pack.tgz file into a new Pack
 */
async function loadPackFromFile(packFilePath) {
  const pack = new Pack();
  const extract = tarStream.extract();
  return new Promise((resolve, reject) => {
    fs.createReadStream(packFilePath)
      .pipe(gunzip())
      .pipe(extract);
    extract.on('entry', async function(header, stream, next) {
      if (header.type === 'file') {
        const name = header.name.replace(/^\.\//, '');
        const data = await toString(stream);
        pack.addResource({ name, data });
      } else {
        stream.resume();
      }
      next();
    });
    extract.on('finish', function() {
      resolve(pack);
    });
  });
}

/**
 * Load pack files from a directory into a new Pack
 */
async function loadPackFromDir(packDirPath) {
  const pack = new Pack();
  return new Promise((resolve, reject) => {
    walk(packDirPath)
      .on('data', item => {
        if (item.stats.isFile()) {
          const name = path.relative(packDirPath, item.path);
          const data = fs.readFileSync(item.path, { encoding: 'utf8' });
          pack.addResource({ name, data });
        }
      })
      .on('end', function() {
        resolve(pack);
      });
  });
}

async function loadPack({ packRef, version }) {
  // Pack is path to local pack dir
  if (fs.pathExistsSync(path.resolve(packRef, 'packfile.yml'))) {
    console.log(`Loading pack from local directory ${packRef}`);
    return loadPackFromDir(packRef);
  }

  // Pack is path to local .tgz
  if (fs.pathExistsSync(path.resolve(packRef)) && path.extname(packRef) === '.tgz') {
    console.log(`Loading pack from local file ${packRef}`);
    return loadPackFromFile(packRef);
  }

  // Looks like a local path not found
  if (path.isAbsolute(packRef) || packRef.startsWith('.')) {
    throw new Error(`path ${packRef} not found`);
  }

  // Find matching repo & pack
  const repoPackMatch = /(?<repo>.*)\/(?<pack>.*)$/.exec(packRef);
  if (repoPackMatch && repoPackMatch.groups.repo && repoPackMatch.groups.pack) {
    const { repo, pack } = repoPackMatch.groups;
    if (repoExists(repo)) {
      console.log(`Loading pack from repo ${repo}`);
      const cachedPackPath = await getRepoPack({ repoName: repo, pack, version });
      if (cachedPackPath) return loadPackFromFile(cachedPackPath);
    }
  }

  // TODO - Pack is URL?

  // TODO fail case?
  throw new Error('Could not match pack to local or remote reference');
}

async function bundle({ packDir, outputPath }) {
  const pack = await loadPackFromDir(packDir);
  const outputFilename = `${pack.metadata.name}-${pack.metadata.version}.tgz`;
  const outputFilePath = `${outputPath}/${outputFilename}`;

  await tar.c(
    {
      gzip: true,
      cwd: packDir,
      file: outputFilePath
    },
    ['.']
  );

  return outputFilePath;
}

module.exports = {
  loadPack,
  bundle
};
