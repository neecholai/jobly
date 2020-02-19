const express = require('express');
const ExpressError = require('../helpers/expressError');
const Company = require('../models/company');
const jsonschema = require('jsonschema');
const companySchema = require('../schemas/companySchema');
const updateCompanySchema = require('../schemas/updateCompanySchema');

const router = new express.Router();

/**
 * Route for GET /companies
 * This should return JSON of {companies: [{ handle, name }, ...]}
 */

router.get('/', async (req, res, next) => {
  try {

    const search = req.query.search;
    const min_employees = req.query.min_employees;
    const max_employees = req.query.max_employees;
    const companies = Company.getCompanies(search, min_employees, max_employees);

    return res.json({ companies });
  } 
  
  catch (err) {
    return next(err);
  }
});

/**
 * POST /companies
 * This should create a new company and return the newly created company.
 * This should return JSON of {company: { handle, name, num_employees, description, logo_url } }
 */

router.post('/', async (req, res, next) => {
  try {
    const result = jsonschema.validate(req.body, companySchema);

    if (!result.valid) {
      // pass validatrion errors to error handler
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const company = await Company.create(req.body);

    return res.status(201).json({ company });
  }

  catch (err) {
    return next(err);
  }
});

/**
 * GET /companies/[handle]
 * This should return a single company found by its id.
 * This should return JSON of {company: { handle, name, num_employees, description, logo_url } }
 */

router.get('/:handle', async (req, res, next) => {
  try {
    const company = await Company.getCompany(req.params.handle);
    return res.json({ company });
  }

  catch (err) {
    return next(err);
  }
});

/**
 * PATCH /companies/[handle]
 * This should update an existing company and return the updated company.
 * This should return JSON of {company: { handle, name, num_employees, description, logo_url } }
 */

router.patch('/:handle', async (req, res, next) => {
  try {
    const handle = req.params.handle;
    const items = req.body;
    const result = jsonschema.validate(items, updateCompanySchema);

    if (!result.valid) {
      // pass validatrion errors to error handler
      let listOfErrors = result.errors.map(error => error.stack);
      throw new ExpressError(listOfErrors, 400);
    }

    const company = await Company.updateCompany(handle, items);
    return res.json({ company });
  }

  catch (err) {
    return next(err);
  }
});

/**
 * DELETE /companies/[handle]
 * This should remove an existing company and return a message.
 * This should return JSON of {message: "Company deleted"}
 */

router.delete('/:handle', async (req, res, next) => {
  try {
    const result = Company.deleteCompany(req.params.handle);
    return res.json(result);
  }

  catch (err) {
    return next(err);
  }
});