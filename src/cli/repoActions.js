const Table = require('cli-table');
const { searchRepositories } = require('../query');
const { updateAllRepos, indexRepo, add, list, remove } = require('../repo');
const { Command } = require('commander');

const program = new Command();

function parse(argv) {

  program
    .command('ls')
    .description('List repository')
    .action(repo_list)
  program
    .command('add <name> <url>')
    .description('Add repository')
    .action(repo_add)
  program
    .command('rm <nameOrUrl>')
    .description('Remove repository')
    .action(repo_remove)
  program
    .command('search <keyword>')
    .description('Search the repository for pack by name')
    .action(repo_search)
  program
    .command('index')
    .description('build index file for repo in current directory')
    .option('--merge <str>', 'Merge this index with existing index file (path or url)')
    .option('--url <str>', 'Base URL where packs are hosted')
    .action(repo_index)

  program
    .command('update')
    .description(
      `Update information of available packs locally from pack repositories`
    )
    .action(repo_update);

  program.parse(argv);
}

async function repo_update(cmd) {
  await updateAllRepos();
  console.log('Cache successfully updated');
}

async function repo_index(cmd) {
  indexRepo({ baseUrl: cmd.url, merge: cmd.merge });
}

async function repo_search(keyword, cmd) {
  const packs = await searchRepositories(keyword);
  const table = new Table({
    head: ['Name', 'Version', 'Pack reference', 'Description']
  });

  packs.forEach(p => {
    table.push([p.name, p.version, p.packRef, p.description]);
  });

  console.log(table.toString());
}

async function repo_add(cmd, name, url, cmd) {
  if (cmd !== 'add') return;
  try {
    if (typeof name !== 'string' || typeof url !== 'string') {
      throw new Error('Repository name or url are either missing or invalid');
    }

    await add({ name, url });
    console.log(`Added repository ${name}`);
  } catch (err) {
    console.log(err.message);
  }
}

async function repo_list(cmd) {

  const table = new Table({
    head: ['Name', 'Url']
  });

  config.repositories.forEach(p => {
    table.push([p.name, p.url]);
  });

  console.log(table.toString());
}

async function repo_remove(name, cmd) {
  try {
    if (typeof name !== 'string') {
      throw new Error('Repository name/url is either missing or invalid');
    }

    await remove(name);
    console.log(`Removed repository ${name}`);
  } catch (err) {
    console.log(err.message);
  }
}

module.exports = {
  parse
  //help
};