const yaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');
const Table = require('cli-table');
const lodash = require('lodash');
const inquirer = require('inquirer');
const deepExtend = require('deep-extend');
const { compileAndDeploy, remove, upgrade } = require('../index');
const { queryInstalledPack, searchRepositories } = require('../query');
const repo = require('../repo');
const { generatePack } = require('../pack/create');
const questions = require('./questions');

function noEmptyValues(obj) {
  lodash.forOwn(obj, (value, key) => {
    if (!value) {
      console.error(`${key} missing or invalid value`);
      process.exit(1);
    }
  });
}

function create() {
  inquirer.prompt(questions.create).then(answers => generatePack(answers));
}

function pack_deploy(packRef, stack, cmd) {
  noEmptyValues({ packRef, stack });

  let values = {};

  if (cmd.valuesFile) {
    values = yaml.safeLoad(fs.readFileSync(path.resolve(cmd.valuesFile)));
  }

  // If any values were set with --set
  if (Object.keys(cmd.set).length) {
    values = deepExtend(values, cmd.set);
  }

  compileAndDeploy({ packRef, stack, values });
}

function pack_remove(pack, stack) {
  try {
    remove({ name: pack, stack });
  } catch (err) {
    console.error(err.message);
  }
}

async function pack_upgrade(pack) {
  await upgrade(pack);
}

function pack_ls() {
  queryInstalledPack().then(packs => {
    const table = new Table({
      head: ['Name', 'Version', 'Stack']
    });

    packs.forEach(p => {
      table.push([p.name, p.version, p.stack]);
    });

    console.log(table.toString());
  });
}

async function pack_inspect_version(packRef) {
  noEmptyValues({ packRef });
  const pack = await repo.inspectPack(packRef);
  console.log(
    JSON.stringify(
      {
        version: pack.version,
        commit_hash: pack.commit_hash
      },
      null,
      2
    )
  );
}

async function pack_inspect(packRef) {
  noEmptyValues({ packRef });
  console.log(JSON.stringify(await repo.inspectPack(packRef), null, 2));
}

async function cache_update(cmd) {
  if (cmd !== 'update') return;

  await repo.cacheUpdate();
  console.log('Cache successfully updated');
}

async function cache_clear(cmd) {
  if (cmd !== 'clear') return;
  await repo.cacheClear();
  console.log('Local repository cache cleared');
}

async function repo_search(keyword) {
  const packs = await searchRepositories(keyword);
  const table = new Table({
    head: ['Name', 'Version', 'Pack reference', 'Description']
  });

  packs.forEach(p => {
    table.push([p.name, p.version, p.packRef, p.description]);
  });

  console.log(table.toString());
}

async function repo_add(cmd, name, url) {
  if (cmd !== 'add') return;

  try {
    if (typeof name !== 'string' || typeof url !== 'string') {
      throw new Error('Repository name or url are either missing or invalid');
    }

    await repo.add({ name, url });
    console.log(`Added repository ${name}`);
  } catch (err) {
    console.log(err.message);
  }
}

async function repo_remove(cmd, name) {
  if (cmd !== 'rm') return;

  try {
    if (typeof name !== 'string') {
      throw new Error('Repository name/url is either missing or invalid');
    }

    await repo.remove(name);
    console.log(`Removed repository ${name}`);
  } catch (err) {
    console.log(err.message);
  }
}

async function repo_list(cmd) {
  if (cmd !== 'ls') return;

  const repos = await repo.list();
  const table = new Table({
    head: ['Name', 'Url']
  });

  repos.forEach(p => {
    table.push([p.name, p.url]);
  });

  console.log(table.toString());
}

module.exports = {
  pack_deploy,
  pack_remove,
  pack_upgrade,
  pack_ls,
  pack_inspect,
  pack_inspect_version,
  cache_clear,
  cache_update,
  repo_search,
  repo_add,
  repo_remove,
  repo_list,
  create
};
