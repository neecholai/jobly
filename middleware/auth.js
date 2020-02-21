/** Middleware for handling req authorization for routes. */
const ExpressError = require('../helpers/expressError');
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** Middleware: Authenticate user. */

const authenticateJWT = (req, res, next) => {
  try {
    const token = req.body._token;
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = payload;
    return next();
  }
  catch(err) {
    return next();
  }
}

const ensureLoggedIn = (req, res, next) => {
  try {

    if (!req.user) {
      throw new ExpressError("Unauthorized user", 401);
    }

    return next();
  }

  catch(err) {
    return next(err);
  }
}

const ensureCorrectUser = (req, res, next) => {
  try {

    if (req.user.username === req.params.username) {
      return next();
    } else {
      throw new ExpressError("Unauthorized user", 401);
    }
    
  }
  catch(err) {
    return next(err);
  }
}

const ensureAdmin = (req, res, next) => {
  try {

    if (req.user.is_admin) {
      return next();
    }

    throw new ExpressError("Unauthorized user", 401);
  }
    catch(err) {
      return next(err);
    }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  ensureAdmin
}















































// function authenticateJWT(req, res, next) {
//     try {
//       const tokenFromBody = req.body._token;
//       const payload = jwt.verify(tokenFromBody, SECRET_KEY);
//       req.user = payload; // create a current user
//       return next();
//     } catch (err) {
//       return next();
//     }
//   }

//   /** Middleware: Requires user is authenticated. */

//   function ensureLoggedIn(req, res, next) {
//     if (!req.user) {
//       return next({ status: 401, message: "Unauthorized" });
//     } else {
//       return next();
//     }
//   }

//   /** Middleware: Requires correct username. */

//   function ensureCorrectUser(req, res, next) {
//     try {
//       if (req.user.username === req.params.username) {
//         return next();
//       } else {
//         return next({ status: 401, message: "Unauthorized" });
//       }
//     } catch (err) {
//       // errors would happen here if we made a request and req.user is undefined
//       return next({ status: 401, message: "Unauthorized" });
//     }
//   }
//   // end

//   module.exports = {
//     authenticateJWT,
//     ensureLoggedIn,
//     ensureCorrectUser
//   };