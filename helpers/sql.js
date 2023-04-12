const { BadRequestError } = require("../expressError");

// TODO: THIS NEEDS SOME GREAT DOCUMENTATION.
/** sqlForPartialUpdate(dataToUpdate, jsToSql)
 *
 * - First arg: accepts object of JSON data to be updated
 * - Second arg: accepts JS object to be converted to SQL
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
