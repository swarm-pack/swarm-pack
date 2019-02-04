#!/usr/bin/env node
const program = require("commander");

program
  .version("0.0.1")
  .command("deploy", "deploy pack")
  .command("ls", "list deployed pack")
  .parse(process.argv);

