const express = require('express');
const ExpressError = require('../helpers/expressError');
const Job = require('../models/job');
const jsonschema = require('jsonschema');
const jobSchema = require('../schemas/jobSchema');
const updateJobSchema = require('../schemas/updateJobSchema');

const router = new express.Router();

/**
 * Route for GET /jobs
 * This should return JSON of {jobs: [{ title, company_handle }, ...]}
 */

router.get('/', async (req, res, next) => {
  try {

    const { search, min_salary, min_equity } =  req.query;
    const jobs = await Job.getJobs(search, min_salary, min_equity);

    return res.json({ jobs });
  } 
  
  catch (err) {
    return next(err);
  }
});

/**
 * POST /jobs
 * This should create a new job and return the newly created job.
 * This should return JSON of {job: { id, title, salary, equity, company_handle, date_posted } }
 */

router.post('/', async (req, res, next) => {
  try {
    const result = jsonschema.validate(req.body, jobSchema);

    if (!result.valid) {
      // pass validatrion errors to error handler
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const job = await Job.create(req.body);

    return res.status(201).json({ job });
  }

  catch (err) {
    return next(err);
  }
});

/**
 * GET /jobs/[id]
 * This should return a single job found by its id.
 * This should return JSON of {job: { id, title, salary, equity, company_handle, date_posted } }
 */

router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.getJob(req.params.id);
    return res.json({ job });
  }

  catch (err) {
    return next(err);
  }
});

/**
 * PATCH /jobs/[id]
 * This should update an existing job and return the updated job.
 * This should return JSON of {job: { id, title, salary, equity, company_handle, date_posted } }
 */

router.patch('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const items = req.body;
    const result = jsonschema.validate(items, updateJobSchema);

    if (!result.valid) {
      // pass validatrion errors to error handler
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const job = await Job.updateJob(id, items);
    return res.json({ job });
  }

  catch (err) {
    return next(err);
  }
});

/**
 * DELETE /jobs/[id]
 * This should remove an existing job and return a message.
 * This should return JSON of {message: "job deleted"}
 */

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await Job.deleteJob(req.params.id);
    return res.json(result);
  }

  catch (err) {
    return next(err);
  }
});

module.exports = router;