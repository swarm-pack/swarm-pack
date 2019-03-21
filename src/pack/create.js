const fs = require('fs-extra');
const path = require('path');
const nunjucks = require('nunjucks');

const packFileName = 'packfile.yml';
const defaultsFileName = 'defaults.yml';
const composeFileName = 'docker-compose.tpl.yml';

const packTemplate = `---
pack:
  name: <<pack_name>>
  version: 0.0.1
  #home: URL for Pack homepage, e.g. github URL
  description: <<pack_description>>
  keywords: []
  sources: []
  maintainers: []
`;

const defaultsTemplate = `---
service_name: <<pack_name>>
image:
  repository: <<image_repo>>
  tag: <<image_tag>>
<<%- if use_sync %>>
  tag_pattern: <<tag_pattern>>
<<% endif %>>

<<%- if default_port %>>
  ports:
    - <<default_port>>
<<%- endif %>>

deploy:
  mode: replicated
  replicas: 1
  placement_constraints: []
<<%- if use_sync %>>
swarm-sync:
  managed: true
<<% endif %>>

<<%- if use_traefik %>>
traefik:
  port: <<traefik_port>>
  hostname: <<traefik_host>>
  stickiness: True
<<%- endif %>>
`;

const composeTemplate = `---
version: '3.6'

services:
  {{ service_name }}:
    image: {{ image.repository }}:{{ image.tag }}

<<%- if default_port %>>
    #Ports
{% for port in ports %}
{% if loop.first %}
    ports:
{% endif %}
      - {{ port }}
{% endfor %}
<<% endif %>>

    deploy:
      mode: {{ deploy.mode }}
      replicas: {{ deploy.replicas }}

      # Placement constraints
{% if deploy.placement_constraints | length %}
      placement:
        constraints:
{% for p in deploy.placement_constraints %}
          - "{{ p }}"
{% endfor %}
{% endif %}

      labels:
        - "swarm-pack.managed=true"
<<%- if use_sync %>>
{% if swarm-sync.managed %}
        - "swarm-sync.managed=true"
{% endif %}
{% if image.tag_pattern %}
        - "swarm-sync.image-pattern={{ image.tag_pattern }}"
{% endif %}
<<% endif %>>
<<%- if use_traefik %>>
        - "traefik.port=traefik.port"
        - "traefik.frontend.rule=Host:{{ traefik.hostname }}"
        - "traefik.backend.loadbalancer.stickiness={{ traefik.stickiness }}"
<<% endif %>>

`;

function generatePack(answers) {
  // Since we are generating a nunjucks template
  // with a template...
  // we need a different syntax for the outer template
  nunjucks.configure({
    autoescape: false,
    tags: {
      blockStart: '<<%',
      blockEnd: '%>>',
      variableStart: '<<',
      variableEnd: '>>',
      commentStart: '<<#',
      commentEnd: '#>>'
    }
  });

  const packDir = path.join(process.cwd(), answers.pack_name);
  if (fs.pathExistsSync(packDir)) {
    console.log(`Cannot create ${packDir}, already exists`);
    process.exit(1);
  }

  fs.ensureDirSync(packDir);
  fs.outputFileSync(
    path.join(packDir, packFileName),
    nunjucks.renderString(packTemplate, answers)
  );
  fs.outputFileSync(
    path.join(packDir, defaultsFileName),
    nunjucks.renderString(defaultsTemplate, answers)
  );
  fs.outputFileSync(
    path.join(packDir, composeFileName),
    nunjucks.renderString(composeTemplate, answers)
  );

  console.log(`
    Success! Created a new pack at ${packDir}
    We've included some example configurations for you to configure or remove as needed.
    Good luck developing your new pack.
  `);
}

module.exports = {
  generatePack
};
