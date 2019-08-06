const fs = require('fs-extra');
const path = require('path');
const nunjucks = require('nunjucks');
const inquirer = require('inquirer');

const packFileName = 'packfile.yml';
const defaultsFileName = 'defaults.yml';
const composeFileName = 'docker-compose.tpl.yml';

const questions = [
  {
    type: 'input',
    name: 'pack_name',
    message: 'New Pack name:',
    validate(value) {
      if (value === '') return 'Please specify a Pack name';
      return value.match(/^[a-z0-9_]*/i)
        ? true
        : 'Pack name must be letters, numbers or _';
    }
  },

  {
    type: 'input',
    name: 'pack_description',
    message: 'Short description of this pack:'
  },

  {
    type: 'input',
    name: 'image_repo',
    message: 'Docker image for this pack, e.g. myorg/myapp',
    validate(value) {
      return value.match(/^[a-z0-9-_:./@]*/i)
        ? true
        : 'Image contains invalid characters';
    }
  },

  {
    type: 'input',
    name: 'image_tag',
    message: 'Default tag for this image',
    validate(value) {
      return value.match(/^[a-z0-9-_/@]*/i) ? true : 'Tag contains invalid characters';
    }
  },

  {
    type: 'confirm',
    name: 'use_sync',
    message: 'Include Swarm-Sync configuration in this Pack?'
  },

  {
    type: 'input',
    name: 'tag_pattern',
    message: 'Swarm-sync tag pattern, e.g. semver:^1.1.1',
    when: answers => answers.use_sync
  },

  {
    type: 'number',
    name: 'default_port',
    message: 'Default port to expose (or none)',
    default: false
  },

  {
    type: 'confirm',
    name: 'use_traefik',
    message: 'Does this Pack expose routes (via Traefik)?'
  },
  {
    type: 'number',
    name: 'traefik_port',
    message: 'Which port will traefik route to?',
    when: answers => answers.use_traefik
  },

  {
    type: 'input',
    name: 'traefik_host',
    message: 'Which host will traefik expose on?',
    when: answers => answers.use_traefik
  }
];

const packTemplate = `---
pack:
  name: <<pack_name>>
  version: 0.1.0
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
<<%- endif %>>

<<%- if default_port %>>
  ports:
    - <<default_port>>
<<%- endif %>>

# Deploy allows all docker-compose options, except for labels
deploy:
  mode: replicated
  replicas: 1

<<% if use_sync %>>
swarm_sync:
  managed: true
<<%- endif %>>

# Accepts same options/format as docker-compose
logging:

networks:
  default:
    driver: overlay
    attachable: true

<<%- if use_traefik %>>
traefik:
  port: <<traefik_port>>
  hostname: <<traefik_host>>
  stickiness: True
  network: 
<<%- endif %>>
`;

const composeTemplate = `---
version: '3.6'

services:
  {{ service_name }}:
    image: "{{ image.repository }}:{{ image.tag }}"

<<%- if default_port %>>
    # Ports
    {{ dumpblock_if_set({value: ports, indent: 4, root: 'ports'}) }}
<<% endif %>>

    # Deploy
    deploy:
      {{ deploy | dumpyml(6)}}
      labels:
<<%- if use_sync %>>
        - "swarm-sync.managed={{ swarm_sync.managed }}"
        {% if image.tag_pattern %}- "swarm-sync.image-pattern={{ image.tag_pattern }}"{% endif %}
<<%- endif %>>
<<%- if use_traefik %>>
        - "traefik.port=traefik.port"
        - "traefik.frontend.rule=Host:{{ traefik.hostname }}"
        - "traefik.backend.loadbalancer.stickiness={{ traefik.stickiness }}"
        {% if traefik.network %}- "traefik.docker.network={{ traefik.network }}"{% endif %}
<<%- endif %>>
    # /Deploy

    # Logging
    {{ dumpblock_if_set({value: logging, indent: 4, root: 'logging'}) }}

    networks:
    {%- for net, def in networks %}
      - {{ net }}
    {%- endfor %}

    # volumes:

## Other assets (not-service)
networks: {{ networks | dump }}
# volumes:
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

async function pack_create() {
  inquirer.prompt(questions).then(answers => generatePack(answers));
}

module.exports = {
  pack_create
};
