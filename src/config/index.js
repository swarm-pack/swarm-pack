const Docker = require('dockerode');
const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const deepExtend = require('deep-extend');
const os = require('os');

let defaults = {};
let config = {};
let initialized = false;

const defaultConfigDirName = '.swarm-pack';
const defaultConfigFileName = 'config.yml';
const defaultCacheDirName = 'cache';

// Individual config helper for Docker config
function configureDocker({ socketPath = false, host = false, port = '2375' }) {
  if (socketPath && host) {
    throw new Error('Cannot specify both socketPath & host in configuration.');
  }

  if (host && (host.includes(':') || host.includes('/'))) {
    throw new Error(
      'Unlike docker -H, host should be a hostname only. Use port (--port) to specify port.'
    );
  }

  if (host) {
    config.docker = { host, port, url: `tcp://${host}:${port}` };
  } else if (socketPath) {
    config.docker = { socketPath, url: `unix://${socketPath}` };
  }
}

/*
Call include config and call init() when ENV vars and config files are ready

Always
  - Load defaults within package?
  - Override defaults with anything below...?
  - Determine the "mode" of execution and make available in config helper (e.g. mode = CLI or mode = NPM)?

When installing globally (or run fist time from CLI)
  - create a ~/.swarm-pack/config with defaults
  - export SWARM_PACK_CONFIG_FILE=~/.swarm-pack/config

When swarm-pack executed from CLI
  - load file pointed at SWARM_PACK_CONFIG_FILE
  - then apply overrides from CLI args

When swarm-pack called from javascript interface (e.g. as npm dependency)
  - ignore SWARM_PACK_CONFIG_FILE
  - accept either { config } or { config_file } via method ( some sort of init pattern ?)
  - apply overrides at the method level
*/
function init({ program, moduleConfig }) {
  // Load defaults
  defaults = yaml.safeLoad(fs.readFileSync(path.resolve(__dirname, './defaults.yml')));

  // Running from CLI
  if (program) {
    // Initialize .swarm-pack in home dir if needed
    if (!process.env.SWARM_PACK_CONFIG_FILE) {
      // Create .swarm-pack in home dir if it doesn't exist
      if (!fs.pathExistsSync(path.join(os.homedir(), defaultConfigDirName))) {
        fs.mkdir(path.join(os.homedir(), defaultConfigDirName));
      }

      // Create cache dir if it doesn't exist
      if (!fs.pathExistsSync(path.join(os.homedir(), defaultConfigDirName, defaultCacheDirName))) {
        fs.mkdir(path.join(os.homedir(), defaultConfigDirName, defaultCacheDirName));
      }

      // Copy defaults.yml to config dir if doesn't exist
      if (
        !fs.pathExistsSync(path.join(os.homedir(), defaultConfigDirName, defaultConfigFileName))
      ) {
        fs.copyFileSync(
          path.join(__dirname, 'defaults.yml'),
          path.join(os.homedir(), defaultConfigDirName, defaultConfigFileName)
        );
      }

      process.env.SWARM_PACK_CONFIG_FILE = path.join(
        os.homedir(),
        defaultConfigDirName,
        defaultConfigFileName
      );
    }

    const configFile = process.env.SWARM_PACK_CONFIG_FILE;
    if (!fs.pathExistsSync(process.env.SWARM_PACK_CONFIG_FILE)) {
      throw new Error(`Could not find config file specified by SWARM_PACK_CONFIG_FILE`);
    }
    config = deepExtend(
      {},
      defaults,
      yaml.safeLoad(fs.readFileSync(process.env.SWARM_PACK_CONFIG_FILE))
    );

    // CLI & other overrides last, these take precedence
    configureDocker({ ...program });
    config.cacheDir = path.join(os.homedir(), defaultConfigDirName, defaultCacheDirName);

    // Running as NPM module - optional config passed in
  } else if (moduleConfig) {
    config = deepExtend({}, defaults, moduleConfig);
  }

  initialized = true;
}

function get() {
  if (!initialized) {
    throw new Error('Config must be initialized first!');
  }
  return config;
}

module.exports = {
  init,
  get
};
