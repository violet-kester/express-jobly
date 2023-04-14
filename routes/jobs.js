"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
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