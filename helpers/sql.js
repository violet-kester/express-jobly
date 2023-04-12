const { BadRequestError } = require("../expressError");

// TODO: THIS NEEDS SOME GREAT DOCUMENTATION.

/** sqlForPartialUpdate(dataToUpdate, jsToSql)
 *
 *  generates cols and vals for sql query from json data
 *
 * - First arg: accepts object of JSON data to be updated
 * - Second arg: accepts JS object mapping JS properties to SQL cols
 *
 * - Returns:
 *   {
 *       setCols: '"first_name"=$1, "last_name"=$2',
 *       values: ['firstName', 'lastName']
 *   }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // keys = [firstName, age]
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };


