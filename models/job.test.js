"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("POST /jobs", function () {

  const newJob = {
    title: "Tester",
    salary: 9999999,
    equity: .5,
    company_handle: "test-co",
  };

  test("works for admin", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual(newJob);
    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS companyHandle
           FROM jobs
           WHERE title='Tester' AND company_handle='test-co'`);
    expect(result.rows).toEqual({
      id: expect.any(Number),
      title: "Tester",
      salary: 9999999,
      equity: .5,
      company_handle: "test-co",
    });
  });

  test("throws error if invalid data", async function () {
    try {
      await Job.create({ ...newJob, company_handle: "bad-bad" });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 1,
        title: "J1",
        salary: 100,
        equity: .1,
        company_handle: "c1",
      },
      {
        id: 2,
        title: "J2",
        salary: 200,
        equity: .2,
        company_handle: "c2",
      },
      {
        id: 3,
        title: "J3",
        salary: 300,
        equity: 0,
        company_handle: "c3",
      },
    ]);
  });
});

/************************************** search */

describe("search", function () {

  test("works - search by title", async function () {
    let jobs = await Job.search({ "title": "2" });
    expect(companies).toEqual([
      {
        id: expect.any(Number),
        title: "J2",
        salary: 200,
        equity: .2,
        company_handle: "c2"
      },
    ]);
  });

  test("works - search by min salary", async function () {
    let jobs = await Job.search({ "minSalary": 300 });
    expect(companies).toEqual([
      {
        id: expect.any(Number),
        title: "J3",
        salary: 300,
        equity: 0,
        company_handle: "c3"
      },
    ]);
  });

  test("works - search by has equity", async function () {
    let jobs = await Job.search({ "hasEquity": true });
    expect(companies).toEqual([
      {
        id: expect.any(Number),
        title: "J1",
        salary: 100,
        equity: .1,
        company_handle: "c1"
      },
      {
        id: expect.any(Number),
        title: "J2",
        salary: 200,
        equity: .2,
        company_handle: "c2"
      }
    ]);
  });

  test("works - search by no equity", async function () {
    let jobs = await Job.search({ "hasEquity": false });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "J1",
        salary: 100,
        equity: .1,
        company_handle: "c1"
      },
      {
        id: expect.any(Number),
        title: "J2",
        salary: 200,
        equity: .2,
        company_handle: "c2"
      },
      {
        id: expect.any(Number),
        title: "J3",
        salary: 300,
        equity: 0,
        company_handle: "c3"
      }
    ]);
  });

  test("bad request with query strings", async function () {
    try {
      await Job.search({ bad: "2" });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("J1");
    expect(job).toEqual({
      id: expect.any(Number),
      title: "J1",
      salary: 100,
      equity: .1,
      company_handle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {

  const updateData = {
    title: "updatedTitle",
    salary: 9999999999,
    equity: .9
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: expect.any(Number),
      company_handle: "C1",
      ...updateData,
    });
    const result = await db.query(
      `SELECT title, salary, equity, company_handle
      FROM jobs
      WHERE title='updatedTitle' AND company_handle='c1'`);
    expect(result.rows).toEqual({
      id: 1,
      title: "updatedTitle",
      salary: 9999999999,
      equity: .9,
      companyHandle: "c1"
    });
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "updatedTitle",
      salary: null,
    };
    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: 1,
      equity: .1,
      company_handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS companyHandle
      FROM jobs
      WHERE title='updatedTitle' AND company_handle='C1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  // test("not found if no such company", async function () {
  //   try {
  //     await Company.update("nope", updateData);
  //     throw new Error("fail test, you shouldn't get here");
  //   } catch (err) {
  //     expect(err instanceof NotFoundError).toBeTruthy();
  //   }
  // });

  // test("bad request with no data", async function () {
  //   try {
  //     await Company.update("c1", {});
  //     throw new Error("fail test, you shouldn't get here");
  //   } catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  // });
});

// /************************************** remove */

// describe("remove", function () {
//   test("works", async function () {
//     await Company.remove("c1");
//     const res = await db.query(
//       "SELECT handle FROM companies WHERE handle='c1'");
//     expect(res.rows.length).toEqual(0);
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Company.remove("nope");
//       throw new Error("fail test, you shouldn't get here");
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });
// });