const Table = require('cli-table');
const { Command } = require('commander');
const { queryInstalledPack } = require('../query');
const { remove } = require('../index');

const program = new Command();

function parse(argv) {
  program
    .command('ls')
    .description('list deployed packs')
    .action(release_ls);

  program
    .command('remove <pack> <stack>')
    .description('Remove pack from a swarm cluster namespaced')
    .action(release_remove);

  program.parse(argv);
}

function release_remove(pack, stack) {
  try {
    remove({ name: pack, stack });
  } catch (err) {
    console.error(err.message);
  }
}

function release_ls() {
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

module.exports = {
  parse
  // help
};
