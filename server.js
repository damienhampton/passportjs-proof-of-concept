'use strict'
const config = require('./src/config');
const userModel = require('./src/user-model');

const app = require('./src/app').init({ config, userModel });

app.run();