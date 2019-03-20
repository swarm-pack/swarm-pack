# swarm-pack

Package management for Docker Swarm services.

## Overview

Swarm Pack lets you package Docker Swarm services with common patterns, templating and custom values. Swarm Pack is to Docker Swarm what Helm is to Kubernetes.

The best way to learn is by example, so take a look at the [official repo](https://github.com/swarm-pack/repository) first.

## Installation

For now, pre-compiled binaries for Mac, Linux & Windows are published into [releases](https://github.com/swarm-pack/swarm-pack/releases).

You can copy this into your environment and make it executable and run on the CLI.

Alternatively, if you have nodejs 10+, checkout the code run `npm i` and then `npm link` should create a link to swarm-pack in your PATH which will be executed with nodejs.

Installation improvements are planned for the future.

## Repositories

There is an official Pack repository here: https://github.com/swarm-pack/repository

You can also create your own repos for Swarm Packs and configure Swarm Pack to use them.

## CLI Usage

### Deploy

```
swarm-pack deploy <pack> <stack>
```

`pack` - either a local path for a local pack dir, e.g. `./my_pack` or a repo reference (the repo must be defined in config) e.g. `official/incubator/portainer`.

`stack` - this is the Docker Stack namespace on the Swarm which will be used for the deployment.

### List deployed Packs

```
swarm-pack ls
```

### Inspect a Pack in the repository

```
swarm-pack inspect <pack>
```

`pack` - either a local path for a local pack dir, e.g. `./my_pack` or a repo reference (the repo must be defined in config) e.g. `official/incubator/portainer`.

### Manage the local repo cache

Update the local repo cache

```
swarm-pack cache update
```

Clear the cache
```
swarm-pack cache clear
```

### Search for Packs in repos

```
swarm-pack search <keyword>
```

### Manage configured Pack repositories

Pack repos are repo git URLS, e.g. [official repo](https://github.com/swarm-pack/repository)

List repos in use:
```
swarm-pack repo ls
```

Add a remote repo:
```
swarm-pack repo add <name> <url>
```

Remove a configured repo:
```
swarm-pack repo rm <name> || <url>
```

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
