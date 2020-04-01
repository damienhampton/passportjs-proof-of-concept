'use strict'
require('dotenv').config();
const config = require('./src/config');
const userModel = require('./src/user-model');
const fs = require('fs').promises;

async function main(){
  await loadCertificate(config.GOOGLE_CERT_NAME, 'GOOGLE_CERT', config)
  await loadCertificate(config.JUMPCLOUD_CERT_NAME, 'JUMPCLOUD_CERT', config)

  const app = require('./src/app').init({ config, userModel });
  app.run();
}

async function loadCertificate(filename, configKey, config){
  const cert = await fs.readFile(`./certs/${filename}`, { encoding: 'utf8' });
  config[configKey]=cert;
}

main();