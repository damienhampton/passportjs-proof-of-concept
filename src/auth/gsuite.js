'use strict'
const SamlStrategy = require('passport-saml').Strategy;

function init({ passport, postLogin, app, config, samlRoute, samlCallbackRoute, postLoginRedirect, userModel }){

  function SamlFunc(profile, done) {
    console.log('DATA FROM GOOGLE:', profile);
    const user = userModel.findUserByEmail(profile.nameID);
    if(!user){
      return done(null, false);
    }
    console.log('MATCHED LOCAL ACCOUNT:', user);
    return done(null, user);
  }

  const samlOpts = {
    callbackUrl: 'https://localhost:3000'+samlCallbackRoute,
    entryPoint: config.GOOGLE_SSO_URL,
    cert: config.GOOGLE_CERT,
    issuer: 'PassportTest'
  }

  passport.use(new SamlStrategy(samlOpts, SamlFunc));

  app.get(samlRoute,
    passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
    function(req, res) {
      res.redirect(postLoginRedirect)
    }
  );

  app.post(samlCallbackRoute,
    passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
    postLogin(postLoginRedirect)
  );
}

module.exports = { init };