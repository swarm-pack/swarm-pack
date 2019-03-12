# swarm-pack

Package management for Docker Swarm services.

## Overview

Swarm Pack lets you package Docker Swarm services with common patterns, templating and custom values. Swarm Pack is to Docker Swarm what Helm is to Kubernetes.

The best way to learn is by example, so take a look at the [official repo](https://github.com/swarm-pack/repository) first.

## Repository

There is an official Pack repository here: https://github.com/swarm-pack/repository

You can also create your own repos for Swarm Packs and configure Swarm Pack to use them.

## CLI Usage

### Deploy

```
swarm-pack deploy <repo> <stack>
```

**repo** - either a local path for a local pack dir, e.g. `./my_pack` or a repo reference (the repo must be defined in config) e.g. `official/incubator/portainer`.

**stack** - this is the Docker Stack namespace on the Swarm which will be used for the deployment.

## NPM usage

Swarm Pack can also be used as an npm package from another javascript application.

```
const SwarmPack = require('swarm-pack');
const swarmpack = SwarmPack({ config });

const stack = "nonprod"
const packRef = "official/incubator/portainer"
const values = {
  tag: "latest"
}

swarmpack.compileAndDeploy({ stack, packRef, values });
```

`config` parameter is an object which is a de-serialized version of the config file. Config files are ignored when used as an NPM package, so this is where config must be provided.
