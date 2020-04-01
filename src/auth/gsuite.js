'use strict'
const SamlStrategy = require('passport-saml').Strategy;

const samlRoute = '/saml';
const samlCallbackRoute = '/saml-callback';

function init({ passport, postLogin, app, config, postLoginRedirect, userModel }){

  function SamlFunc(profile, done) {
    console.log('DATA FROM GOOGLE:', profile);
    // console.log(profile.getAssertionXml())
    console.log(JSON.stringify(profile.getAssertion(), null, 2))
    // console.log(profile.getSamlResponseXml())
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

  passport.use('gsuite-saml', new SamlStrategy(samlOpts, SamlFunc));

  app.get(samlRoute,
    passport.authenticate('gsuite-saml', { failureRedirect: '/', failureFlash: true }),
    function(req, res) {
      res.redirect(postLoginRedirect)
    }
  );

  app.post(samlCallbackRoute,
    passport.authenticate('gsuite-saml', { failureRedirect: '/', failureFlash: true }),
    postLogin(postLoginRedirect)
  );
}

module.exports = { init };