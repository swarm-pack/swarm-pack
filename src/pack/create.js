const fs = require('fs-extra');
const path = require('path');
const nunjucks = require('nunjucks');

const packFileName = 'packfile.yml';
const defaultsFileName = 'defaults.yml';
const composeFileName = 'docker-compose.tpl.yml';

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
    image: "{{ image.repository }}:{{ image.tag }}"

<<%- if default_port %>>
    #Ports
{% for port in ports %}
{% if loop.first %}
    ports:
{% endif %}
      - {{ port }}
{% endfor %}
<<% endif %>>

    # Deploy
    deploy:
      labels:
<<%- if use_sync %>>
        - "swarm-sync.managed={{ swarm_sync.managed }}"
        {% if image.tag_pattern %}- "swarm-sync.image-pattern={{ image.tag_pattern }}"{% endif %}
<<%- endif %>>
<<%- if use_traefik %>>
        - "traefik.port=traefik.port"
        - "traefik.frontend.rule=Host:{{ traefik.hostname }}"
        - "traefik.backend.loadbalancer.stickiness={{ traefik.stickiness }}"
<<%- endif %>>

      # Add various extra "deploy" sections if they are defined
{% for section in 
  ["endpoint_mode", "mode", "placement", "replicas", "resources", "restart_policy", "rollback_config", "update_config"]
%}
    {%- if deploy[section] %}
      {{section}}: {{ deploy[section] | dump }}
    {%- endif %}
{% endfor %}

    # /Deploy

    {%- if logging | length %}
      {{logging}}: {{ logging | dump }}
    {%- endif %}

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

module.exports = {
  generatePack
};
