class SwarmPackError extends Error {
  constructor(args){
    super(args);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class DockerError extends SwarmPackError {
  constructor(args){
    super(args);
  }
}

class PackError extends SwarmPackError {
  constructor(args){
    super(args);
  }
}

class RepoError extends SwarmPackError {
  constructor(args){
    super(args);
  }
}

module.exports = {
  DockerError, PackError, RepoError
}