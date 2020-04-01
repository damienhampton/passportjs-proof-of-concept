'use strict'
const SamlStrategy = require('passport-saml').Strategy;

const jumpcloudCallbackRoute = '/jumpcloud-callback';
const jumpcloudRoute = '/jumpcloud';

function init({ passport, postLogin, app, config, postLoginRedirect, userModel }){

  function SamlFunc(profile, done) {
    console.log('DATA FROM JUMP CLOUD:', profile);

    const user = userModel.findUserByEmail(profile.nameID);
    if(!user){
      return done(null, false);
    }
    console.log('MATCHED LOCAL ACCOUNT:', user);
    return done(null, user);
  }

  const samlOpts = {
    callbackUrl: 'https://localhost:3000'+jumpcloudCallbackRoute,
    entryPoint: 'https://sso.jumpcloud.com/saml2/saml2',
    cert: config.JUMPCLOUD_CERT,
    issuer: 'PassportTest'
  }

  passport.use('jumpcloud-saml', new SamlStrategy(samlOpts, SamlFunc));

  app.get(jumpcloudRoute,
    passport.authenticate('jumpcloud-saml', { failureRedirect: '/', failureFlash: true }),
    function(req, res) {
      res.redirect(postLoginRedirect)
    }
  );

  app.post(jumpcloudCallbackRoute,
    passport.authenticate('jumpcloud-saml', { failureRedirect: '/', failureFlash: true }),
    postLogin(postLoginRedirect)
  );
}

module.exports = { init };