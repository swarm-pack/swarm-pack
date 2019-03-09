const Table = require('cli-table');
const { compileAndDeploy } = require('../index');
const queryInstalledPack = require('../query/queryInstalledPack');
const repo = require('../repo');

function noEmptyValues(obj) {
  for (const [key, value] of Object.entries(obj)) {
    if (!value) {
      console.error(`${key} missing or invalid value`)
      process.exit(1);
    }
  }
}

function pack_deploy(packRef, stack, program) {
  noEmptyValues({packRef, stack});
  compileAndDeploy({ packRef, stack });
}

function pack_ls(_, program) {
  queryInstalledPack().then(packs => {
    const table = new Table({
      head: ['Name', 'Version']
    });

    packs.forEach(p => {
      table.push([p.name, p.version]);
    });

    console.log(table.toString());
  });
}

async function pack_inspect_version(packRef) {
  noEmptyValues({ packRef });
  const pack = await repo.inspectPack(packRef);
  console.log(JSON.stringify({
    version: pack.version,
    commit_hash: pack.commit_hash
  }, null, 2));
}

async function pack_inspect(packRef) {
  noEmptyValues({ packRef });
  console.log(JSON.stringify(await repo.inspectPack(packRef), null, 2));
}

async function cache_update() {
  await repo.cacheUpdate();
  console.log("Cache successfully updated");
}

async function cache_clear() {
  await repo.cacheClear();
  console.log("Local repository cache cleared");
}


module.exports = {
  pack_deploy,
  pack_ls,
  pack_inspect,
  pack_inspect_version,
  cache_clear,
  cache_update
};
