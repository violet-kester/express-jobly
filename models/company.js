"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {

  /** create({handle, name, description, numEmployees, logoUrl)} ----------
   *
   * - Creates a company from data.
   * - Updates database.
   * - Returns new company data.
   *
   * Data should be:
   * { handle, name, description, numEmployees, logoUrl }
   *
   * Returns:
   * { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   *
   **/
  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies(
          handle,
          name,
          description,
          num_employees,
          logo_url)
           VALUES
             ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** findAll()------------------------------------------------------------
   *
   * Find all companies.
   *
   * Returns:
   * [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** search(searchTermObject) --------------------------------------------
   *
   * Can search on provided (optional) filters:
   * - minEmployees
   * - maxEmployees
   * - nameLike (will find case-insensitive, partial matches)
   *
   * Example expected data:
   * { "nameLike": "hall", "minEmployees": "200" }
   *
   * Returns:
   * [{ handle, name, description, numEmployees, logoUrl }, ...]
   */
  static async search(searchTermObject) {

    // extract keys from search term object
    // ["nameLike", "minEmployees", "maxEmployees"]
    const keys = Object.keys(searchTermObject);

    // map each key to a parameterized WHERE clause
    const queryFilterStrings = keys.map((key, idx) => {
      if (key === "nameLike") {
        searchTermObject[key] = `%${searchTermObject[key]}%`;
        return `name ILIKE $${idx + 1}`;
      }
      if (key === "minEmployees") {
        return `num_employees >= $${idx + 1}`;
      }
      if (key === "maxEmployees") {
        return `num_employees <= $${idx + 1}`;
      }
    });

    // throw bad request error if min > max exmployees in search term object
    if ("minEmployees" in searchTermObject
      && "maxEmployees" in searchTermObject) {
      if (searchTermObject.minEmployees > searchTermObject.maxEmployees) {
        throw new BadRequestError("Min employees cannot be greater than max.");
      }
    }

    // extract search values from search term object
    const values = keys.map((val) => {
      return searchTermObject[val];
    });

    // join array of WHERE clauses
    const queryFilterString = queryFilterStrings.join(' AND ');

    // throw bad request error if invalid search key provided
    if (!queryFilterString) throw new BadRequestError(
      "Search keys can only be nameLike, minEmployees, or maxEmployees."
    );

    // form WHERE clauses into final query string
    const querySql =
      `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
             FROM companies
             WHERE ${queryFilterString}
             ORDER BY name`;

    // query db using generated query string
    const result = await db.query(querySql, values);

    return result.rows;
  }


  //   const keys = Object.keys(dataToUpdate);

  // const cols = keys.map((colName, idx) =>
  //   `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  // );

  //   return {
  //   setCols: cols.join(", "),
  //   values: Object.values(dataToUpdate),
  // };


  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE companies
      SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
