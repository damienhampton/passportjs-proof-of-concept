'use strict'
const passport = require('passport');
const cookieParser = require('cookie-parser')

const azure = require('./auth/azure');
const gsuite = require('./auth/gsuite');
const jumpcloud = require('./auth/jumpcloud');
const gsuiteOAuth = require('./auth/gsuite-oauth');
const local = require('./auth/local');
const token = require('./auth/token');

const tokenStrategyName = 'jwt';

function init({ app, config, postLoginRedirect, postLogoutRedirect, userModel }){

  const checkPermissions = requiredPermissions => (req, _, next) => {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [ requiredPermissions ];
    if(!req || !req.user || !req.user.permissions){
      next('Not allowed');
    }

    const allowed = permissions.reduce((allowed, permission) => {
      return allowed && req.user.permissions.find(p => p === permission);
    }, true);

    if(!allowed){
      next('Not allowed');
    }

    next();
  }

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.use(cookieParser());
  app.use(passport.initialize());

  const { postLogin } = token.init({ tokenStrategyName, passport, app, config, postLoginRedirect, postLogoutRedirect, userModel });

  local.init({ passport, postLogin, app, config, postLoginRedirect, postLogoutRedirect, userModel });
  azure.init({ passport, postLogin, app, config, postLoginRedirect, userModel });
  gsuite.init({ passport, postLogin, app, config, postLoginRedirect, userModel });
  jumpcloud.init({ passport, postLogin, app, config, postLoginRedirect, userModel });
  gsuiteOAuth.init({ passport, postLogin, app, config, postLoginRedirect, userModel });

  return requiredPermissions => [ passport.authenticate(tokenStrategyName, { session: false }) , checkPermissions(requiredPermissions)]
}

module.exports = { init };