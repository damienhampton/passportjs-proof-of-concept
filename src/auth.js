'use strict'
const passport = require('passport');
const cookieParser = require('cookie-parser')
const JwtStrategy = require('passport-jwt').Strategy;
const jwt = require('jsonwebtoken');

const azure = require('./auth/azure');
const gsuite = require('./auth/gsuite');
const local = require('./auth/local');

function init({ app, config, azureRoute, azureCallbackRoute, samlRoute, samlCallbackRoute, loginRoute, logoutRoute, refreshRoute, expiryCheckRoute, postLoginRedirect, postLogoutRedirect, userModel }){

  function AuthoriseRequest(jwt_payload, done) {
    const username = extractUsernameFromJWT(jwt_payload);
    const user = userModel.findUser(username);
    if(!user){
      return done(null, false);
    }
    return done(null, user, jwt_payload);
  }

  function extractUsernameFromJWT(jwToken){
    return jwToken.data.username;
  }

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

  const postLogin = (redirectUrl) => (req, res) => {
    const jwt = createJWT(req.user.username);
    res.cookie('token', jwt, cookieOptions(isSecure(config)));
    res.redirect(redirectUrl);
  }

  function createJWT(username){
    const data =  {
      username
    }
    return jwt.sign({ data, }, config.JWT_SIGNATURE, { expiresIn: config.TOKEN_EXPIRY });
  }

  const cookieExtractor = req => {
    if(!req || !req.cookies){
      return null;
    }
    return req.cookies['token'];
  }

  const opts = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: config.JWT_SIGNATURE
  }

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
  passport.use(new JwtStrategy(opts, AuthoriseRequest));

  app.use(cookieParser());
  app.use(passport.initialize());

  app.get(refreshRoute, passport.authenticate('jwt'), (req, res) => {
    const jwt = createJWT(req.user.username);
    res.cookie('token', jwt, cookieOptions(isSecure(config)));
    res.json({ message: 'success' });
  });

  app.get(expiryCheckRoute, passport.authenticate('jwt'), (req, res) => {
    res.json({ expires: req.authInfo.exp });
  });

  local.init({ passport, postLogin, app, config, loginRoute, logoutRoute, refreshRoute, expiryCheckRoute, postLoginRedirect, postLogoutRedirect, userModel })
  azure.init({ passport, postLogin, app, config, azureRoute, azureCallbackRoute, postLoginRedirect, userModel })
  gsuite.init({ passport, postLogin, app, config, samlRoute, samlCallbackRoute, postLoginRedirect, userModel })

  return requiredPermissions => [ passport.authenticate('jwt', { session: false }) , checkPermissions(requiredPermissions)]
}

const cookieOptions = (secure = false) => ({
  expiries: new Date(Date.now() + 10000000),
  secure,
  httpOnly: true,
  path: '/'
})

const isSecure = ({ HTTPS }) => HTTPS === true;

module.exports = { init };