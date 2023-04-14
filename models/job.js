"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {

  /** Create a job (from data), update db, return new job data.
   *
   * Data should be { title, salary, equity, companyHandle }:
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const results = await db.query(
      `SELECT title
           FROM jobs
           WHERE company_handle = $1`,
      [companyHandle]);

    const company = results.rows[0];

    if (!company) throw new NotFoundError("No Company!");

    const result = await db.query(
      `INSERT INTO jobs(
          title,
          salary,
          equity,
          company_handle)
           VALUES
             ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        companyHandle
      ],
    );
    const job = result.rows[0];
    if (!job) throw new BadRequestError();


    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);
    return jobsRes.rows;
  }

  /** Search jobs with filter
   *
   * Can filter on provided search filters:
   * - title
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

  static async search(searchTermObject) {

    // ["title", "minSalary", "hasEquity"]
    const keys = Object.keys(searchTermObject);

    // generate sql query string from searchTermObject
    const queryFilterStrings = keys.map((key, idx) => {
      if (key === "title") {
        searchTermObject[key] = `%${searchTermObject[key]}%`;
        return `title ILIKE $${idx + 1}`;
      }
      if (key === "minSalary") {
        return `salary >= $${idx + 1}`;
      }
      if (key === "hasEquity") {

        // NOTE: why can't we move `searchTermObject.hasEquity = 0`;
        if (searchTermObject.hasEquity === false) {
          searchTermObject.hasEquity = 0;
          return `equity >= $${idx + 1}`;
        } else {
          searchTermObject.hasEquity = 0;
          return `equity > $${idx + 1}`;
        }
      }
    });

    const values = keys.map((val) => {
      return searchTermObject[val];
    });

    const queryFilterString = queryFilterStrings.join(' AND ');
    console.log("query string", queryFilterString);

    if (!queryFilterString) throw new BadRequestError(
      "key can only be title, minSalary, or hasEquity."
    );

    const querySql =
      `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
             FROM jobs
             WHERE ${queryFilterString}
             ORDER BY title`;

    const result = await db.query(querySql, values);

    return result.rows;
  }

  /** Given a job id, return data about job.
  *
  * Returns { id, title, salary, equity, companyHandle }
  *
  *
  * Throws NotFoundError if not found.
  **/

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]);

    const job = results.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
  *
  * This is a "partial update" --- it's fine if data doesn't contain all the
  * fields; this only changes provided ones.
  *
  * Data can include: { title, salary, equity }
  *
  * Returns {id, title, salary, equity, companyHandle}
  *
  * Throws NotFoundError if not found.
  */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        companyHandle: "company_handle",
      });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
 *
 * Throws NotFoundError if company not found.
 **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
             FROM jobs
             WHERE id = $1
             RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}



module.exports = Job;
