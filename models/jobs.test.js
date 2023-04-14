// "use strict";

// const db = require("../db.js");
// const { BadRequestError, NotFoundError } = require("../expressError");
// const Job = require("./job.js");
// const {
//   commonBeforeAll,
//   commonBeforeEach,
//   commonAfterEach,
//   commonAfterAll,
// } = require("./_testCommon");

// beforeAll(commonBeforeAll);
// beforeEach(commonBeforeEach);
// afterEach(commonAfterEach);
// afterAll(commonAfterAll);

// /************************************** create */

// describe("POST /jobs", function () {
//   const newJob = {
//     id: 99999,
//     title: "Tester",
//     salary: 9999999,
//     equity: .5,
//     company_handle: "test-co",
//   };

//   test("ok for admin", async function () {
//     const resp = await request(app)
//       .post("/jobs")
//       .send(newJob)
//       .set("authorization", `Bearer ${u3Token}`);
//     expect(resp.statusCode).toEqual(201);
//     expect(resp.body).toEqual({
//       company: newCompany,
//     });
//   });