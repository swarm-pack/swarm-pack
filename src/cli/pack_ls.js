const Table = require('cli-table');
const queryInstalledPack = require('../query/queryInstalledPack');

function pack_ls(_, program) {
  if (program.host) {
    process.env.DOCKER_HOST = program.host;
  }
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

module.exports = pack_ls;
