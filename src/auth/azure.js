'use strict'
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

function init({ passport, postLogin, app, config, azureRoute, azureCallbackRoute, postLoginRedirect, userModel }){

  function AzureFunc(iss, sub, profile, accessToken, refreshToken, done) {
    console.log('iss', iss, 'sub', sub, 'profile', profile, 'accessToken', accessToken, 'refreshToken', refreshToken)
    // if (!profile.oid) {
    //   return done(new Error("No oid found"), null);
    // }
    // findByOid(profile.oid, function(err, user) {
    //   if (err) {
    //     return done(err);
    //   }
    //   if (!user) {
    //     // "Auto-registration"
    //     users.push(profile);
    //     return done(null, profile);
    //   }
    //   return done(null, user);
    // });
    const user = userModel.findUserByEmail(profile._json.email);
    if(!user){
      return done(null, false);
    }
    console.log('MATCHED LOCAL ACCOUNT:', user);
    return done(null, user);
  }

  const azureOpts = {
    identityMetadata: config.AZURE_IDENTITY_METADATA, //required
    clientID: config.AZURE_CLIENT_ID, //required
    responseType: 'code', //required
    responseMode: 'form_post', //required
    redirectUrl: 'https://localhost:3000'+azureCallbackRoute, //required
    clientSecret: config.AZURE_CLIENT_SECRET,
    issuer: 'PassportTest',
    passReqToCallback: false,
    // nonceLifetime: config.creds.nonceLifetime,
    // nonceMaxAmount: config.creds.nonceMaxAmount,
    useCookieInsteadOfSession: true,
    cookieSameSite: true,
    cookieEncryptionKeys: [{key: config.AZURE_COOKIE_KEY, iv: config.AZURE_COOKIE_IV }],
  }

  passport.use(new OIDCStrategy(azureOpts, AzureFunc));

  app.get(azureRoute,
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/boom1' }),
    function(req, res) {
      res.redirect(postLoginRedirect)
    }
  );

  app.post(azureCallbackRoute,
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/boom2' }),
    postLogin(postLoginRedirect)
  );
}

module.exports = { init };