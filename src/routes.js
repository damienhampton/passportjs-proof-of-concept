'use strict'
const express = require('express')
const permissions = require('./permissions');
const fs = require('fs').promises;

function init({ authoriser, config: { G_SUITE_DOMAIN } }){
  const router = express.Router();

  router.get('/', (_, res) => {
    res.send(`<h1>public - login here</h1>
    <style>
    label, button {
      display: block;
    }
    </style>
    <h2>With username and password...</h2>
    <form>
      <p>e.g. buffy / pwd1</p>
      <label>Username: <input id="username" type="text" name="username"></label>
      <label>Password: <input id="password" type="password" name="password"></label>
      <button id="loginButton">Login</button>
    </form>

    <h2>With G-Suite SAML (${G_SUITE_DOMAIN} only)</h2>
    <p><a href="/saml">Authenticate with Google</a>

    <h2>With Jumpcloud SAML</h2>
    <p><a href="/jumpcloud">Authenticate with Jumpcloud</a>

    <h2>With G-Suite OAuth(${G_SUITE_DOMAIN} only)</h2>
    <p><a href="/gsuite-oauth">Authenticate with Google</a>


    <h2>With Azure AD (Specific single tenant only)</h2>
    <p><a href="/azure">Authenticate with Azure AD</a>

    <script src="client-form.js"></script>`);
  });

  router.get('/client-form.js', async (_, res) => {
    const js = await fs.readFile(`${__dirname}/client-form.js`, { encoding: 'utf8' });
    res.setHeader('Content-Type','application/javascript');
    res.send(js);
  });


  router.get('/cats', authoriser(permissions.ALLOW_ALL_CATS), (_, res) => {
    res.send(`<h1>cats</h1>`);
  });

  router.get('/food', authoriser(permissions.ALLOW_FOOD), (_, res) => {
    res.send('<h1>food</h1>');
  });

  router.get('/treats', authoriser(permissions.ALLOW_TREATS), (_, res) => {
    res.send(`<h1>treats</h1>`);
  });

  return router
}

module.exports = { init };
