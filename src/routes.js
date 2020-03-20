'use strict'
const express = require('express')
const permissions = require('./permissions');

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

    <h2>With G-Suite (${G_SUITE_DOMAIN} only)</h2>
    <p><a href="/saml">Authenticate with Google</a>


    <h2>With Azure AD (Specific single tenant only)</h2>
    <p><a href="/azure">Authenticate with Azure AD</a>


    <script>
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');

    loginButton.addEventListener('click', (e) => {
      const username = usernameInput.value;
      const password = passwordInput.value;
      e.preventDefault();
      console.log(e, username, password);
      window.href = '/login?username='+username+'&password='+password;
    })

    </script>`);
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
