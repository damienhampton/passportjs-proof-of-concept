'use strict'
const passport = require('passport');
const cookieParser = require('cookie-parser')
const SamlStrategy = require('passport-saml').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy
const JwtStrategy = require('passport-jwt').Strategy;
const jwt = require('jsonwebtoken');

function init({ app, config, azureRoute, azureCallbackRoute, samlRoute, samlCallbackRoute, loginRoute, logoutRoute, refreshRoute, expiryCheckRoute, postLoginRedirect, postLogoutRedirect, userModel }){

  function AuthoriseRequest(jwt_payload, done) {
    const username = extractUsernameFromJWT(jwt_payload);
    const user = userModel.findUser(username);
    if(!user){
      return done(null, false);
    }
    return done(null, user, jwt_payload);
  }

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

  function SamlFunc(profile, done) {
    console.log('DATA FROM GOOGLE:', profile);
    const user = userModel.findUserByEmail(profile.nameID);
    if(!user){
      return done(null, false);
    }
    console.log('MATCHED LOCAL ACCOUNT:', user);
    return done(null, user);
  }

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

  function createJWT(username){
    const data =  {
      username
    }
    return jwt.sign({ data, }, config.JWT_SIGNATURE, { expiresIn: config.TOKEN_EXPIRY });
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

  var opts = {}
  opts.jwtFromRequest = cookieExtractor;
  opts.secretOrKey = config.JWT_SIGNATURE;

  const samlOpts = {
    callbackUrl: 'https://localhost:3000'+samlCallbackRoute,
    entryPoint: config.GOOGLE_SSO_URL,
    cert: config.GOOGLE_CERT,
    issuer: 'PassportTest'
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

  passport.use(new SamlStrategy(samlOpts, SamlFunc));
  passport.use(new OIDCStrategy(azureOpts, AzureFunc));
  passport.use(new JwtStrategy(opts, AuthoriseRequest));
  passport.use(new LocalStrategy(AuthenticateUser));
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.use(cookieParser());
  app.use(passport.initialize());

  app.get(samlRoute,
    passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
    function(req, res) {
      res.redirect(postLoginRedirect)
    }
  );

  app.post(samlCallbackRoute,
    passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }),
    function(req, res) {
      const jwt = createJWT(req.user.username);
      res.cookie('token', jwt, cookieOptions(isSecure(config)));
      res.redirect(postLoginRedirect);
    }
  );

  app.get(azureRoute,
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/boom1' }),
    function(req, res) {
      res.redirect(postLoginRedirect)
    }
  );

  app.post(azureCallbackRoute,
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/boom2' }),
    function(req, res) {
      const jwt = createJWT(req.user.username);
      res.cookie('token', jwt, cookieOptions(isSecure(config)));
      res.redirect(postLoginRedirect);
    }
  );

  app.get(loginRoute, passport.authenticate('local'), (req, res) => {
    const jwt = createJWT(req.user.username);
    res.cookie('token', jwt, cookieOptions(isSecure(config)));
    res.redirect(postLoginRedirect)
  });

  app.get(logoutRoute, (req, res) => {
    res.cookie('token', null, cookieOptions(isSecure(config)));
    res.redirect(postLogoutRedirect)
  });

  app.get(refreshRoute, passport.authenticate('jwt'), (req, res) => {
    const jwt = createJWT(req.user.username);
    res.cookie('token', jwt, cookieOptions(isSecure(config)));
    res.json({ message: 'success' });
  });

  app.get(expiryCheckRoute, passport.authenticate('jwt'), (req, res) => {
    res.json({ expires: req.authInfo.exp });
  });

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