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
`;

const defaultsTemplate = `---
service_name: <<pack_name>>
image:
  repository: <<image_repo>>
  tag: <<image_tag>>
<<% if use_sync %>>
  tag_pattern: <<tag_pattern>>
<<% endif %>>
`;

const composeTemplate = `---
version: '3.6'

services:
  {{ service_name }}:
    image: {{ image.repository }}:{{ image.tag }}
`;

function generatePack(answers) {
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
}

module.exports = {
  generatePack
};
