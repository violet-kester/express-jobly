const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate", function () {
    test("Return correct data for setCols and values", function () {
        const dataToUpdate = { firstName: 'Aliya', lastName: 'last'};
        const jsToSql = {firstName: 'first_name', lastName: 'last_name'};

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result).toEqual({
            setCols: '"first_name"=$1, "last_name"=$2',
            values: ['Aliya', 'last']
        });
    });

    // TODO: redundant
    test("Return an object with setCols and values as properties", function () {
        const dataToUpdate = { firstName: 'Aliya', lastName: 'last'};
        const jsToSql = {firstName: 'first_name', lastName: 'last_name'};

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(result).toHaveProperty('setCols');
        expect(result).toHaveProperty('values');
    });

    test("Should throw BadRequestError if dataToUpdate is empty", function () {
        const dataToUpdate = {};
        const jsToSql = {firstName: 'first_name', lastName: 'last_name'};

        expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql)).toThrow(BadRequestError);
    });

    test("Should return camelCase properties if jsToSql is empty", function () {
        const dataToUpdate = {firstName: 'Aliya', lastName: 'last'};
        const jsToSql = {};

        const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

        // TODO: test for the whole object - see line 10
        expect(result.setCols).toEqual('"firstName"=$1, "lastName"=$2');
    });
});