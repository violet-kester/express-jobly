"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

function next(err) {
  if (err) throw new Error("Got error from middleware");
}

describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test" } } };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureLoggedIn(req, res, next)).toThrowError();
  });
});


describe("ensureAdmin", function () {

  test("works if not admin", function () {

    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };

    expect(() => ensureAdmin(req, res, next)).toThrowError();
  });

  test("should fail if isAdmin isn't boolean", function () {

    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: { user: { username: "test", isAdmin: "true" } } };

    expect(() => ensureAdmin(req, res, next)).toThrowError();
  });

  test("works if admin", function () {

    const adminJwt = jwt.sign({ username: "test", isAdmin: true }, SECRET_KEY);
    const user = jwt.verify(adminJwt, SECRET_KEY);

    const req = { headers: { authorization: `Bearer ${adminJwt}` } };
    const res = { locals: { user } };

    ensureAdmin(req, res, next);

    expect(res.locals).toEqual({
      user: {
        username: "test",
        isAdmin: true,
        iat: expect.any(Number)
      }
    });
  });
});


describe("ensureCorrectUserOrAdmin", function () {
  test("works if correct user or admin", function () {

    // generating token for auth user
    const adminJwt = jwt.sign({ username: "test", isAdmin: true }, SECRET_KEY);

    // grabbing auth user from payload
    const payload = jwt.decode(adminJwt);

    // sending auth user payload as req param
    const req = { params: payload };
    const res = { locals: { user: { username: "test" } } };
    ensureCorrectUserOrAdmin(req, res, next);
  });

  // TODO: add a test to test for isAdmin boolean
  test("throws error if invalid data", function () {
    // generate token for invalid admin user data
    const invalidAdminJwt = jwt.sign({ username: "test", isAdmin: "true" }, SECRET_KEY);
    // grab admin user from payload
    const invalidAdminUser = jwt.decode(invalidAdminJwt);

    // set req.params to invalid admin user
    const req = { params: invalidAdminUser };
    // set res.locals (logged-in user) to `test` user
    const res = { locals: { user: { username: "test" } } };

    try {
      ensureCorrectUserOrAdmin(req, res, next);
    } catch (err) {
      expect(() => ensureCorrectUser(req, res, next)).toThrowError();
    }
  });

  test("throws error if incorrect user", function () {
    const req = { locals: { user: { username: "badUserName" } } };
    const res = { locals: { user: { username: "test" } } };

    try {
      ensureCorrectUserOrAdmin(req, res, next);
    } catch (err) {
      //NOTE: ask about this
      // expect(err instanceof UnauthorizedError).toBeTruthy();
      expect(() => ensureCorrectUser(req, res, next)).toThrowError();
    }
  });
});