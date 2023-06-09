"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobId,
  u1Token,
  adminToken,
} = require("./_testCommon");
const Job = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "newJob",
    salary: 88888,
    equity: "0.2",
    companyHandle: "c1"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    console.log(newJob)
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "newJob",
        salary: 88888,
        equity: "0.2",
        companyHandle: "c1"
      }
    });
  });

  // new test
  test("unauth for non-admin user", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      "error": {
        "message": "Unauthorized",
        "status": 401
      }
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "newJob",
        salary: 100000
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "35000",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});


/************************************** GET /jobs */

describe("GET /jobs", function () {

  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: expect.any(Number),
            title: "J1",
            salary: 100,
            equity: "0.1",
            companyHandle: "c1",
          },
          {
            id: expect.any(Number),
            title: "J2",
            salary: 200,
            equity: "0.2",
            companyHandle: "c2",
          },
          {
            id: expect.any(Number),
            title: "J3",
            salary: 300,
            equity: "0",
            companyHandle: "c3",
          },
        ],
    });
  });

  // new test
  test("throws error if invalid data", async function () {
    const resp = await request(app)
      .get("/jobs?minSalary=abcdefg");

    // jobFilterSchema jsonschema validator should throw:
    // BadRequestError(arrayOfValidationErrors)

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.minSalary is not of a type(s) integer"
        ],
        "status": 400
      }
    });
  });

  // new test
  test("throws error if invalid search term", async function () {
    const resp = await request(app)
      .get("/jobs?name=tester");

    expect(resp.statusCode).toEqual(400);
    expect(resp.body).toEqual({
      "error": {
        "message": [
          'instance is not allowed to have the additional property \"name\"'
        ],
        "status": 400
      }
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});


/**************************** GET /jobs - filtered search */

describe("GET /jobs", function () {

  test("filtered search works for anon", async function () {
    const resp = await request(app)
      .get("/jobs?title=2");

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      "jobs":
        [
          {
            id: testJobId[1],
            title: "J2",
            salary: 200,
            equity: "0.2",
            companyHandle: "c2",
          }
        ]
    });
  });

  test("multi-param filtered search works for anon", async function () {
    const resp = await request(app)
      .get("/jobs?title=2&minSalary=110");

      console.log(resp.body, "resppp");

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      "jobs":
        [
          {
            id: testJobId[1],
            title: "J2",
            salary: 200,
            equity: "0.2",
            companyHandle: "c2",
          }
        ]
    });
  });

});


/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {

  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testJobId[0]}`);
    console.log(testJobId[0]);
    expect(resp.body).toEqual({
      job: {
        id: testJobId[0],
        title: "J1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });


  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

// describe("PATCH /jobs/:id", function () {

//   test("works for admins", async function () {
//     const resp = await request(app)
//       .patch(`/jobs/${testJobId[0]}`)
//       .send({
//         title: "J1-new",
//       })
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.body).toEqual({
//       company: {
//         id: testJobId[0],
//         title: "J1-new",
//         salary: 100,
//         equity: "0.1",
//         companyHandle: "c1",
//       },
//     });
//   });

//   test("unauth for anon", async function () {
//     const resp = await request(app)
//       .patch(`/jobs/${testJobId[0]}`)
//       .send({
//         title: "J1-new",
//       });
//     expect(resp.statusCode).toEqual(401);
//   });

//   // new test
//   test("unauth for non-admin user", async function () {
//     const resp = await request(app)
//       .patch(`/jobs/${testJobId[0]}`)
//       .send({
//         name: "C1-new",
//       })
//       .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("not found on no such job", async function () {
//     const resp = await request(app)
//       .patch(`/jobs/nope`)
//       .send({
//         name: "nope-new",
//       })
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(404);
//   });

//   test("bad request on id change attempt", async function () {
//     const resp = await request(app)
//       .patch(`/jobs/${testJobId[0]}`)
//       .send({
//         id: 111,
//       })
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(400);
//   });

//   test("bad request on invalid data", async function () {
//     const resp = await request(app)
//       .patch(`/jobs/${testJobId[0]}`)
//       .send({
//         salary: "abcdefg",
//       })
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(400);
//   });

//   test("bad request on invalid search term", async function () {
//     const resp = await request(app)
//       .patch(`/jobs/${testJobId[0]}`)
//       .send({
//         name: "abcdefg",
//       })
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(400);
//   });
// });

/************************************** DELETE /jobs/:id */

// describe("DELETE /jobs/:id", function () {

//   test("works for admins", async function () {
//     const resp = await request(app)
//       .delete(`/jobs/${testJobId[0]}`)
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.body).toEqual(`{ deleted: "${testJobId[0]}" }`);
//   });

//   test("unauth for non-admin user", async function () {
//     const resp = await request(app)
//       .delete(`/jobs/${testJobId[0]}`)
//       .set("authorization", `Bearer ${u1Token}`);
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("unauth for anon", async function () {
//     const resp = await request(app)
//       .delete(`/jobs/${testJobId[0]}`);
//     expect(resp.statusCode).toEqual(401);
//   });

//   test("not found for no such company", async function () {
//     const resp = await request(app)
//       .delete(`/jobs/nope`)
//       .set("authorization", `Bearer ${adminToken}`);
//     expect(resp.statusCode).toEqual(404);
//   });
// });
