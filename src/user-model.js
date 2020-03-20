'use strict'

const { ALLOW_FOOD, ALLOW_TREATS, ALLOW_ALL_CATS } = require('./permissions');

const roles = {
  GOOD_CAT: {
    permissions: [ ALLOW_FOOD, ALLOW_TREATS, ALLOW_ALL_CATS ]
  },
  BAD_CAT: {
    permissions: [ ALLOW_FOOD, ALLOW_ALL_CATS ]
  }
}

const createUser = (username, email, password, { permissions }) => ({ username, email, password, permissions });
const findUser = (username) => users.find(u => u.username === username);
const validatePassword = (user, password) => user.password === password;
const findUserByEmail = (email) => users.find(u => u.email === email);

const users = [
  createUser('buffy', 'buffy@26brains.com', 'pwd1', roles.BAD_CAT),
  createUser('daisy', 'daisy@26brains.com', 'pwd2', roles.GOOD_CAT),
  createUser('damien', 'damien@26brains.com', 'pwd2', roles.GOOD_CAT)
];

module.exports = {
  validatePassword,
  findUser,
  findUserByEmail
}