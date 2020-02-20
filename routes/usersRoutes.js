const express = require('express');
const ExpressError = require('../helpers/expressError');
const User = require('../models/user');
const jsonschema = require('jsonschema');
const userSchema = require('../schemas/userSchema');
const updateUserSchema = require('../schemas/updateUserSchema');

const router = new express.Router();

/**
 * Route for GET /users
 * This should return JSON of {users: [ { username, first_name, last_name, email }, ... ]}
 */

router.get('/', async (req, res, next) => {
  try {
    const users = await User.getUsers();

    return res.json({ users });
  } 
  
  catch (err) {
    return next(err);
  }
});

/**
 * POST /users
 * This should create a new user and return the newly created user.
 * This should return JSON of {user: { username, first_name, last_name, email, photo_url, is_admin } }
 */

router.post('/', async (req, res, next) => {
  try {
    const result = jsonschema.validate(req.body, userSchema);

    if (!result.valid) {
      // pass validatrion errors to error handler
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const user = await User.create(req.body);

    return res.status(201).json({ user });
  }

  catch (err) {
    return next(err);
  }
});

/**
 * GET /users/[username]
 * This should return a single user found by its username.
 * This should return JSON of {user: { username, first_name, last_name, email, photo_url } }
 */

router.get('/:username', async (req, res, next) => {
  try {
    const user = await User.getUser(req.params.username);
    return res.json({ user });
  }

  catch (err) {
    return next(err);
  }
});

/**
 * PATCH /users/[username]
 * This should update an existing user and return the updated user.
 * This should return JSON of {user: { username, first_name, last_name, email, photo_url } }
 */

router.patch('/:username', async (req, res, next) => {
  try {
    const username = req.params.username;
    const items = req.body;
    const result = jsonschema.validate(items, updateUserSchema);

    if (!result.valid) {
      // pass validatrion errors to error handler
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const user = await User.updateUser(username, items);
    return res.json({ user });
  }

  catch (err) {
    return next(err);
  }
});

/**
 * DELETE /users/[username]
 * This should remove an existing user and return a message.
 * This should return JSON of {message: "User deleted"}
 */

router.delete('/:username', async (req, res, next) => {
  try {
    const result = await User.deleteUser(req.params.username);
    return res.json(result);
  }

  catch (err) {
    return next(err);
  }
});

module.exports = router;