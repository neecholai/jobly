/** Express app for jobly. */

const express = require("express");

const ExpressError = require("./helpers/expressError");

const morgan = require("morgan");

const companiesRoutes = require("./routes/companiesRoutes");
const jobsRoutes = require("./routes/jobsRoutes");
const usersRoutes = require("./routes/usersRoutes");
const authRoutes = require("./routes/authRoutes");
const { authenticateJWT } = require("./middleware/auth");
const app = express();

app.use(express.json());

// Use middleware in all routes
app.use(authenticateJWT);

// Pull all routes from routes files.
app.use("/", authRoutes);
app.use("/companies", companiesRoutes);
app.use("/jobs", jobsRoutes);
app.use("/users", usersRoutes);

// add logging system
app.use(morgan("tiny"));

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  if(process.env.NODE_ENV !== 'test') {
    console.error(err.stack);
  }

  return res.json({
    status: err.status,
    message: err.message
  });
});

module.exports = app;
