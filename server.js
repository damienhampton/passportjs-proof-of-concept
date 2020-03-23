'use strict'
require('dotenv').config();
const config = require('./src/config');
const userModel = require('./src/user-model');
const fs = require('fs').promises;

async function main(){
  await loadGoogleCert(config);
  const app = require('./src/app').init({ config, userModel });
  app.run();
}

async function loadGoogleCert(config){
  const googleCert = await fs.readFile(`./certs/${config.GOOGLE_CERT_NAME}`, { encoding: 'utf8' });
  config.GOOGLE_CERT=googleCert;
}

main();