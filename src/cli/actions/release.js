const Table = require('cli-table');
const { removeRelease } = require('../../lib/docker');
const { queryInstalledPack } = require('../../lib/docker/service');

async function release_remove(pack, stack) {
  try {
    await removeRelease({ pack, stack });
    console.log('Removed release');
  } catch (err) {
    console.error(err.message);
  }
}

function release_ls() {
  queryInstalledPack().then(packs => {
    const table = new Table({
      head: ['Name', 'Stack', 'Version']
    });

    packs.forEach(p => {
      table.push([p.name, p.stack, p.version || '']);
    });

    console.log(table.toString());
  });
}

module.exports = {
  release_ls,
  release_remove
};
