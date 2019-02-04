const program = require("commander");
const compileAndDeploy = require("../index");

program
  .option("-s, --stack <name>", "required stack name")
  .option("-p, --pack <pack>", "required pack")
  .option("-H, --host <host>", "remote docker host")
  .parse(process.argv);

if (!program.stack) {
  console.error("Stack name is required");
}

if (!program.pack) {
  console.error("Pack name or location is required");
}

if (program.stack && program.pack) {
  if(program.host) {
    process.env.DOCKER_HOST = program.host
  }
  compileAndDeploy(program.stack, program.pack);
}
