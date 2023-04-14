"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobFilterSchema = require("../schemas/jobFilter.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * Expected input data { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post("/",
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      jobNewSchema,
      { required: true }
    );

    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  });


/** GET /  =>
 *
 * Search jobs with filter
 *
 * Can filter on provided search filters:
 * - title - will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity - boolean:
 *     if true, show jobs with non-zero equity.
 *     if false or not included: list all jobs regardless of equity)
 *
 * Example expected data:
 * { "title": "title", "minSalary": 100000, "hasEquity": true }
 *
 * Returns:
 * [{ id, title, salary, equity, companyHandle }, ...]
 */

router.get("/", async function (req, res, next) {

    // if no req.query params passed in with request, get all jobs
    if (Object.keys(req.query).length === 0) {
      const jobs = await Job.findAll();
      return res.json({ jobs });
    }
  
    // validate req.query using job FilterSchema
    const validator = jsonschema.validate(
      req.query,
      jobFilterSchema,
      { required: true }
    );
  
    // if data invalid, throw BadRequestError
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      // errs = array of validation errors returned by the jsonschema validator
      // that indicate the specific errors that occurred
      throw new BadRequestError(errs);
    }

  
    // pass in req.query params into search to get filtered jobs
    const jobs = await Job.search(req.query);
  
    return res.json({ jobs });
  });

module.exports = router;
