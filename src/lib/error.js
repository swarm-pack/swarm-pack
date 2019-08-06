class SwarmPackError extends Error {
  constructor(args) {
    super(args);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class DockerError extends SwarmPackError {}

class PackError extends SwarmPackError {}

class RepoError extends SwarmPackError {}

module.exports = {
  DockerError,
  PackError,
  RepoError
};
