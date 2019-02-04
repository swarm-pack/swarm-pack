const program = require("commander");
const Table = require("cli-table");
const queryInstalledPack = require("../query/queryInstalledPack");

program.parse(process.argv);

queryInstalledPack().then(packs => {
  const table = new Table({
    head: ["Name", "Version"],
  });

  packs.forEach(p => {
    table.push([p.name, p.version]);
  });

  console.log(table.toString());
});
