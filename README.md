# Task pack

Stop the Express error handler from leaking internal error text to HTTP clients

## What you are looking at

This is a **sparepack**: a redacted slice of a private repository, containing the contract
and nothing else. The business logic is not here and is not supposed to be.

### Interfaces (1)

Signatures and types only. Every function body throws `sparepack stub: not implemented`.
Your job is to replace those bodies.

- `src/middleware/errorMiddleware.js`
### Acceptance tests (1)

**These are the specification.** Not a suggestion, not a starting point — if they pass, the
task is done. If something about the intended behaviour is not expressed in them, say so
rather than guessing.

- `task-spec/error-handler.test.mjs`

## Working on this

1. Make the acceptance tests pass.
2. Do not weaken a test to make it pass. If a test looks wrong, raise it — that is useful
   feedback and it is the requester's call, not yours.
3. Deliver a patch against this pack's layout.

## What is not here

Anything the requester did not explicitly list. Missing context is not an oversight to route
around — if you cannot complete the task without seeing more, ask. Reconstructing the
surrounding system by guessing produces code that fits nothing.

## Running the tests

```bash
node --test task-spec/*.test.mjs
# or
npm test
```

Node 22 or newer. No dependencies to install — the tests use `node:test` and a hand-rolled
`res` double, so there is no Express and no network.

All nine tests fail right now. That is the starting line, not a problem with the pack.

## Delivering

Fork this repository, make the tests pass, open a pull request here, and comment
`/done <your-PR-url>` on the task issue in
[spare-cycles](https://github.com/mxx1111/spare-cycles/issues).

Please do not weaken a test to make it pass. If one looks wrong, say so on the PR — that is
useful and it is the requester's call.
