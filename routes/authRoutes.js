const express = require('express');
const ExpressError = require('../helpers/expressError');
const User = require('../models/user');
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const router = new express.Router();

/**
 * Route for Logging in a user
 * Returns a JSON Web token, which contains a payload with { username, is_admin }
 */

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const { isAuthenticated, is_admin } = User.authenticate(username, password);

    if (!isAuthenticated) {
      throw new ExpressError("invalid username or password", 400);
    }

    const payload = { username, is_admin };
    const token = jwt.sign(payload, SECRET_KEY);
    return res.json({ token });
    
  }
  catch(err) {
    return next(err);
  }
});