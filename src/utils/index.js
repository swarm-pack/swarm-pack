const { spawn } = require("child_process");

function pipeableSpawn(
  stream,
  command,
  args,
  onExit,
  onError,
  onStdout,
  onStderr
) {
  const child = spawn(command, args, { env: process.env });
  if (stream) {
    stream.pipe(child.stdin);
  }

  child.on("exit", function(code, signal) {
    if (onExit) {
      onExit(code, signal);
    } else {
      console.log(`Process exited with code ${code} and signal ${signal}`);
    }
  });

  child.on("error", function(err) {
    if (onError) {
      onError(err);
    } else {
      console.log(`Process exited with error ${error}`);
    }
  });

  child.stdout.on("data", data => {
    if (onStdout) {
      onStdout(data);
    } else {
      console.log(`Process stdout:\n${data}`);
    }
  });

  child.stderr.on("data", data => {
    if (onStderr) {
      onStderr(data);
    } else {
      console.log(`Process stderr:\n${data}`);
    }
  });
}

module.exports = {
  pipeableSpawn
};
