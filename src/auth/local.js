'use strict'
const LocalStrategy = require('passport-local').Strategy;

function init({ passport, postLogin, app, config, loginRoute, logoutRoute, postLoginRedirect, postLogoutRedirect, userModel }){

  function AuthenticateUser(username, password, done) {
    const user = userModel.findUser(username);
    if(!user){
      const message = { message: 'Incorrect username.' };
      return done(null, false, message);
    }
    if (!userModel.validatePassword(user, password)) {
      const message = { message: 'Incorrect password.' };
      return done(null, false, message);
    }
    return done(null, user);
  }

  passport.use(new LocalStrategy(AuthenticateUser));

  app.get(loginRoute, passport.authenticate('local'), postLogin(postLoginRedirect));

  app.get(logoutRoute, (req, res) => {
    res.cookie('token', null, cookieOptions(isSecure(config)));
    res.redirect(postLogoutRedirect)
  });
}

module.exports = { init };