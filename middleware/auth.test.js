"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin
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


// TODO:
describe("ensureAdmin", function () {

  test("works if not admin", function () {

    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: { user: { username: "test", isAdmin: false } } };

    expect(() => ensureAdmin(req, res, next)).toThrowError();
  });

  test("works if admin", function () {

    const adminJwt = jwt.sign({ username: "test", isAdmin: true }, SECRET_KEY);

    // { username: 'test', isAdmin: true, iat: 1681408849 }
    const user = jwt.verify(adminJwt, SECRET_KEY);

    const res = { locals: { user } };
    const req = { headers: { authorization: `Bearer ${adminJwt}` } };

    ensureAdmin(req, res, next);

    // res.locals { username: 'test', isAdmin: true, iat: 1681409060 }
    expect(res.locals).toEqual({
      user: {
        username: "test",
        isAdmin: true,
        iat: expect.any(Number)
      }
    });
  });
});