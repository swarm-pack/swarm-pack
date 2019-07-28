// This is the default configuration yaml
// it is exposed as a JS module so that nexe can
// bundle it with the app and keep comments & structure
module.exports = `---
# SWARM-PACK DEFAULT CONFIGURATION FILE

# Docker connection configuration
docker:
  socketPath: "/var/run/docker.sock"
  url: "unix:///var/run/docker.sock"

# Configuration for pack repos. Official is recommended to keep.
repositories:
  - name: incubator
    url: http://swarmpack-incubator.s3-website-ap-southeast-1.amazonaws.com
`;
