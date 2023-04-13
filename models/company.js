"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

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

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
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

  // TODO:
  /** Search companies with filter
   *
   * Can filter on provided search filters:
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

    // ["nameLike", "minEmployees", "maxEmployees"]
    const keys = Object.keys(searchTermObject);
    console.log(searchTermObject, "!!!");

    // generate sql query string from searchTermObject
    const queryFilterStrings = keys.map((key, idx) => {
      if (key === "nameLike") {
        searchTermObject[key] = `%${searchTermObject[key]}%`;
        return `name ILIKE $${idx + 1}`;
      }
      if (key === "minEmployees") {
        searchTermObject[key] = Number(searchTermObject[key]);
        return `num_employees >= $${idx + 1}`;
      }
      if (key === "maxEmployees") {
        searchTermObject[key] = Number(searchTermObject[key]);
        return `num_employees <= $${idx + 1}`;
      }
    });

    // TODO: test this
    if ("minEmployees" in searchTermObject
      && "maxEmployees" in searchTermObject) {
      if (searchTermObject.minEmployees > searchTermObject.maxEmployees) {
        throw new BadRequestError("Min employees cannot be greater than max.");
      }
    }

    const values = keys.map((val) => {
      return searchTermObject[val];
    });

    const queryFilterString = queryFilterStrings.join(' AND ');

    if (!queryFilterString) throw new BadRequestError("Invalid search request");

    const querySql =
      `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
             FROM companies
             WHERE ${queryFilterString}
             ORDER BY name`;


    const result = await db.query(querySql, [...values]);

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
