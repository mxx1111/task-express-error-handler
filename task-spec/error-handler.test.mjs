// Acceptance tests for the Express error middleware.
//
// These tests ARE the specification. If they pass, the task is done.
//
// The property under test is a security one: a client learns what went wrong only when the
// server decided to tell them. An unexpected error — a driver throwing, a null dereference —
// carries text written for operators, and that text routinely names tables, file paths, and
// internal hosts. It must not be echoed back over HTTP.

import { test } from 'node:test'
import assert from 'node:assert/strict'

import { AppError } from '../src/utils/AppError.js'
import { errorHandler, notFoundHandler } from '../src/middleware/errorMiddleware.js'

function mockRes() {
  const res = { statusCode: null, body: null }
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (body) => {
    res.body = body
    return res
  }
  return res
}

/** Capture console.error so the test can assert operators still get the detail. */
function captureStderr(fn) {
  const original = console.error
  const lines = []
  console.error = (...args) => lines.push(args.map(String).join(' '))
  try {
    fn()
  } finally {
    console.error = original
  }
  return lines.join('\n')
}

// --- deliberate errors are reported as written --------------------------------

test('an AppError reaches the client intact', () => {
  const res = mockRes()
  errorHandler(new AppError('邮箱已被注册', 409, 'EMAIL_TAKEN'), {}, res, () => {})

  assert.equal(res.statusCode, 409)
  assert.equal(res.body.success, false)
  assert.equal(res.body.error.message, '邮箱已被注册')
  assert.equal(res.body.error.code, 'EMAIL_TAKEN')
})

test('an AppError keeps its defaults when none were given', () => {
  const res = mockRes()
  errorHandler(new AppError('bad request'), {}, res, () => {})

  assert.equal(res.statusCode, 400)
  assert.equal(res.body.error.code, 'APP_ERROR')
})

// --- unexpected errors are not ------------------------------------------------

test('an unexpected error does not leak its message to the client', () => {
  const res = mockRes()
  const leaky = new Error('connect ECONNREFUSED 10.0.3.42:5432 database "voiceai_prod"')

  captureStderr(() => errorHandler(leaky, {}, res, () => {}))

  assert.equal(res.statusCode, 500)
  const serialised = JSON.stringify(res.body)
  assert.ok(!serialised.includes('10.0.3.42'), 'response leaked an internal address')
  assert.ok(!serialised.includes('voiceai_prod'), 'response leaked a database name')
  assert.ok(!serialised.includes('ECONNREFUSED'), 'response leaked driver-level detail')
  assert.ok(res.body.error.message.length > 0, 'the client still needs to be told something')
})

test('an unexpected error never carries a stack trace to the client', () => {
  const res = mockRes()
  captureStderr(() => errorHandler(new TypeError('x is not a function'), {}, res, () => {}))

  const serialised = JSON.stringify(res.body)
  assert.ok(!serialised.includes('at '), 'response contained stack frames')
  assert.equal(res.body.error.stack, undefined)
})

test('operators still get the real error on stderr', () => {
  const res = mockRes()
  const logged = captureStderr(() =>
    errorHandler(new Error('connect ECONNREFUSED 10.0.3.42:5432'), {}, res, () => {}),
  )

  assert.ok(
    logged.includes('ECONNREFUSED') || logged.includes('10.0.3.42'),
    'swallowing the error entirely is not the fix — it has to go somewhere a human can read it',
  )
})

test('a thrown non-Error value is handled rather than crashing the handler', () => {
  const res = mockRes()
  captureStderr(() => errorHandler('just a string', {}, res, () => {}))

  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
  assert.ok(!JSON.stringify(res.body).includes('just a string'))
})

// --- an error object is not a licence to set any status ----------------------

test('a plain error carrying statusCode 4xx is still treated as unexpected', () => {
  // Only AppError is a deliberate, client-facing error. A driver that happens to set
  // `statusCode` on its own exception must not thereby get its message published.
  const res = mockRes()
  const sneaky = new Error('table users_private has no column named tier')
  sneaky.statusCode = 400

  captureStderr(() => errorHandler(sneaky, {}, res, () => {}))

  assert.ok(
    !JSON.stringify(res.body).includes('users_private'),
    'a statusCode on an arbitrary error must not make its message client-facing',
  )
})

// --- 404 ----------------------------------------------------------------------

test('notFoundHandler passes a 404 to the next handler', () => {
  let passed = null
  notFoundHandler({ originalUrl: '/api/nope' }, mockRes(), (err) => {
    passed = err
  })

  assert.ok(passed instanceof Error)
  assert.equal(passed.statusCode, 404)
})

test('the 404 path renders through errorHandler as a 404', () => {
  const res = mockRes()
  notFoundHandler({ originalUrl: '/api/nope' }, mockRes(), (err) => {
    captureStderr(() => errorHandler(err, {}, res, () => {}))
  })

  assert.equal(res.statusCode, 404, 'a missing route is a client error, not a server error')
})
