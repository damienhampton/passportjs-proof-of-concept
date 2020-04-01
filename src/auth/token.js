'use strict'
const JwtStrategy = require('passport-jwt').Strategy;
const jwt = require('jsonwebtoken');

const refreshRoute = '/refresh';
const expiryCheckRoute = '/expiry-check';

function init({ tokenStrategyName, passport, app, config, userModel }){

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

  passport.use(tokenStrategyName, new JwtStrategy(opts, AuthoriseRequest));

  app.get(refreshRoute, passport.authenticate('jwt'), (req, res) => {
    const jwt = createJWT(req.user.username);
    res.cookie('token', jwt, cookieOptions(isSecure(config)));
    res.json({ message: 'success' });
  });

  app.get(expiryCheckRoute, passport.authenticate('jwt'), (req, res) => {
    res.json({ expires: req.authInfo.exp });
  });

  return { postLogin }
}

const cookieOptions = (secure = false) => ({
  expiries: new Date(Date.now() + 10000000),
  secure,
  httpOnly: true,
  path: '/'
})

const isSecure = ({ HTTPS }) => HTTPS === true;

module.exports = { init };