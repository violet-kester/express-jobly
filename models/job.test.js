"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobId,
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
    equity: "0.5",
    companyHandle: "c1",
  };

  test("works for admin", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual(
      {
        id: expect.any(Number),
        title: "Tester",
        salary: 9999999,
        equity: "0.5",
        companyHandle: "c1",
      }
    );

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title='Tester'`);

    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "Tester",
        salary: 9999999,
        equity: "0.5",
        company_handle: "c1",
      }
    ]);
  });

  test("throws error if missing company", async function () {
    try {
      await Job.create({
        title: "Tester",
        salary: 9999999,
        equity: "0.5",
        companyHandle: "badHandle",
      });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  // test("bad request with dupe", async function () {
  //   try {
  //     await Job.create(newJob);
  //     await Job.create(newJob);
  //     throw new Error("fail test, you shouldn't get here");
  //   } catch (err) {
  //     expect(err instanceof BadRequestError).toBeTruthy();
  //   }
  // });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: testJobId[0],
        title: "J1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: testJobId[1],
        title: "J2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: testJobId[2],
        title: "J3",
        salary: 300,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** search */

// describe("search", function () {

//   test("works - search by title", async function () {
//     let jobs = await Job.search({ "title": "2" });
//     expect(companies).toEqual([
//       {
//         id: expect.any(Number),
//         title: "J2",
//         salary: 200,
//         equity: .2,
//         company_handle: "c2"
//       },
//     ]);
//   });

//   test("works - search by min salary", async function () {
//     let jobs = await Job.search({ "minSalary": 300 });
//     expect(companies).toEqual([
//       {
//         id: expect.any(Number),
//         title: "J3",
//         salary: 300,
//         equity: 0,
//         company_handle: "c3"
//       },
//     ]);
//   });

//   test("works - search by has equity", async function () {
//     let jobs = await Job.search({ "hasEquity": true });
//     expect(companies).toEqual([
//       {
//         id: expect.any(Number),
//         title: "J1",
//         salary: 100,
//         equity: .1,
//         company_handle: "c1"
//       },
//       {
//         id: expect.any(Number),
//         title: "J2",
//         salary: 200,
//         equity: .2,
//         company_handle: "c2"
//       }
//     ]);
//   });

//   test("works - search by no equity", async function () {
//     let jobs = await Job.search({ "hasEquity": false });
//     expect(jobs).toEqual([
//       {
//         id: expect.any(Number),
//         title: "J1",
//         salary: 100,
//         equity: .1,
//         company_handle: "c1"
//       },
//       {
//         id: expect.any(Number),
//         title: "J2",
//         salary: 200,
//         equity: .2,
//         company_handle: "c2"
//       },
//       {
//         id: expect.any(Number),
//         title: "J3",
//         salary: 300,
//         equity: 0,
//         company_handle: "c3"
//       }
//     ]);
//   });

//   test("bad request with query strings", async function () {
//     try {
//       await Job.search({ bad: "2" });
//     } catch (err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   });
// });

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(testJobId[0]);
    expect(job).toEqual({
      id: testJobId[0],
      title: "J1",
      salary: 100,
      equity: "0.1",
      companyHandle: "c1"
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
    salary: 100000,
    equity: ".9"
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
      salary: 100000,
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

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
      "SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});