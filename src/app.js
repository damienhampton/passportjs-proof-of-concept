'use strict'
const express = require('express');
const fs = require('fs');
const https = require('https');
const auth = require('./auth');
const bodyParser = require('body-parser');

function init({ config, userModel }){
  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  const params = {
    app,
    config,
    samlRoute: '/saml',
    samlCallbackRoute: '/saml-callback',
    azureRoute: '/azure',
    azureCallbackRoute: '/azure-callback',
    loginRoute: '/login',
    logoutRoute: '/logout',
    refreshRoute: '/refresh',
    expiryCheckRoute: '/expiry-check',
    postLoginRedirect: '/cats',
    postLogoutRedirect: '/',
    userModel
  }

  const authoriser = auth.init(params);

  const routes = require('./routes').init({ authoriser, config });
  app.use('/', routes);

  return {
    run(){
      const params = { app, config };
      config.HTTPS ? runHttps(params) : runHttp(params);
    }
  }
}

function runHttp({ app, config }){
  app.listen(config.PORT, () => {
    console.log(`http server starting on port : ${config.PORT}`)
  });
}

function runHttps({ app, config }){
  const key = fs.readFileSync('./certs/selfsigned.key');
  const cert = fs.readFileSync('./certs/selfsigned.crt');
  const options = {
    key,
    cert
  }
  const server = https.createServer(options, app);

  server.listen(3000, () => {
    console.log(`https server starting on port : ${config.PORT}`)
  });
}

module.exports = { init };