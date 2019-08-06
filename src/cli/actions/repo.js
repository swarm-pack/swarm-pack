const Table = require('cli-table');
const config = require('../../config');
const {
  updateAllRepos,
  indexRepo,
  addRepo,
  removeRepo,
  searchCache
} = require('../../lib/repo');

// const { searchRepositories } = require('../query');
// const { updateAllRepos, indexRepo, add, list, remove } = require('../repo');

async function repo_update(/* cmd */) {
  await updateAllRepos();
  console.log('Cache successfully updated');
}

async function repo_index(cmd) {
  indexRepo({ baseUrl: cmd.url, merge: cmd.merge });
  console.log('Created index.yml');
}

async function repo_search(keyword /* , cmd */) {
  const packEntries = await searchCache(keyword);
  const table = new Table({
    head: ['Name', 'Version', 'Pack reference']
  });
  packEntries.forEach(p => {
    table.push([p.name, p.version, `${p.repo}/${p.name}`]);
  });
  console.log(table.toString());
}

async function repo_add(name, url /* , cmd */) {
  try {
    if (typeof name !== 'string' || typeof url !== 'string') {
      throw new Error('Repository name or url are either missing or invalid');
    }
    await addRepo({ name, url });
    console.log(`Added repository ${name}`);
  } catch (err) {
    console.log(err.message);
  }
}

async function repo_list(/* cmd */) {
  const table = new Table({ head: ['Name', 'Url'] });
  config.repositories.forEach(p => {
    table.push([p.name, p.url]);
  });
  console.log(table.toString());
}

async function repo_remove(name /* , cmd */) {
  try {
    if (typeof name !== 'string') {
      throw new Error('Repository name/url is either missing or invalid');
    }
    await removeRepo(name);
    console.log(`Removed repository ${name}`);
  } catch (err) {
    console.log(err.message);
  }
}

module.exports = {
  repo_list,
  repo_add,
  repo_remove,
  repo_search,
  repo_index,
  repo_update
};
