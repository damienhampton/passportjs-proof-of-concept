'use strict'
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const {OAuth2Client} = require('google-auth-library');

const gsuiteOAuthRoute = '/gsuite-oauth';
const gsuiteOAuthCallbackRoute = '/gsuite-oauth-callback';

function init({ passport, postLogin, app, config, postLoginRedirect, userModel }){

  const oAuth2Client = new OAuth2Client(
    config.GSUITE_CLIENT_ID,
    config.GSUITE_CLIENT_SECRET
  );

  async function GoogleFunc(accessToken, refreshToken, profile, cb) {
    console.log('DATA FROM GOOGLE accessToken:', accessToken);
    console.log('DATA FROM GOOGLE refreshToken:', refreshToken);
    console.log('DATA FROM GOOGLE profile:', profile);

    const tokenInfo = await oAuth2Client.getTokenInfo(
      accessToken
    );
    console.log(tokenInfo);

    const user = userModel.findUserByEmail(profile.nameID);
    if(!user){
      return cb(null, false);
    }
    console.log('MATCHED LOCAL ACCOUNT:', user);
    return cb(null, user);
  }

  const googleOpts = {
    clientID: config.GSUITE_CLIENT_ID,
    clientSecret: config.GSUITE_CLIENT_SECRET,
    callbackURL: 'https://localhost:3000'+gsuiteOAuthCallbackRoute
  }

  passport.use(new GoogleStrategy(googleOpts, GoogleFunc));

  app.get(gsuiteOAuthRoute,
    passport.authenticate('google', { scope: ['profile', 'https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly'] }),
    function(req, res) {
      res.redirect(postLoginRedirect)
    }
  );

  app.get(gsuiteOAuthCallbackRoute,
    passport.authenticate('google', { failureRedirect: '/' }),
    postLogin(postLoginRedirect)
  );
}

module.exports = { init };