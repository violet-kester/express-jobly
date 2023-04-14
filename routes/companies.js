"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companyFilterSchema = require("../schemas/companyFilter.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * Expected input data { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin
 */

router.post("/",
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      companyNewSchema,
      { required: true }
    );

    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  });


/** GET /  =>
 * { companies: [{ handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Example expected data:
 * { "nameLike": "hall", "minEmployees": "200" }
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {

  // if no req.query params passed in with request, get all companies
  if (Object.keys(req.query).length === 0) {
    const companies = await Company.findAll();
    return res.json({ companies });
  }

  // validate req.query using companyFilterSchema
  const validator = jsonschema.validate(
    req.query,
    companyFilterSchema,
    { required: true }
  );

  // if data invalid, throw BadRequestError
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    // errs = array of validation errors returned by the jsonschema validator
    // that indicate the specific errors that occurred
    throw new BadRequestError(errs);
  }

  // NOTE: ask about json validator str -> num
  // if min/max employees params passed in, convert string num vals to num
  if ("minEmployees" in req.query) {
    req.query.minEmployees = Number(req.query.minEmployees);
  }
  if ("maxEmployees" in req.query) {
    req.query.maxEmployees = Number(req.query.maxEmployees);
  }

  // pass in req.query params into search to get filtered companies
  const companies = await Company.search(req.query);

  return res.json({ companies });
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  const company = await Company.get(req.params.handle);
  return res.json({ company });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin
 */

router.patch("/:handle",
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      companyUpdateSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  });

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete("/:handle",
  ensureAdmin,
  async function (req, res, next) {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  });


module.exports = router;
