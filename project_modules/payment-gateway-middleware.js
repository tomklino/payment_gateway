const debug = require('nice_debug')("PAYMENT_GATEWAY_MIDDLEWARE_DEBUG")
const router = require('express').Router()
const cryptoRandomString = require('crypto-random-string');

const CREATE_ACCOUNT_STATEMENT =
  'INSERT INTO `Accounts` (`account_token`, `account_name`) VALUES (?, ?)'

function generateToken() {
  return cryptoRandomString(128)
}

module.exports = function({ mysqlConnectionPool }) {
  router.post('/create/:account_name', function(req, res, next) {
    let account_token = generateToken();
    mysqlConnectionPool.execute(CREATE_ACCOUNT_STATEMENT, [
      account_token, req.params.account_name
    ])
    .then(() => {
      res.end(JSON.stringify({ token: account_token }))
    })
    .catch((e) => {
      debug(1, "error while trying to create account:", e)
      res.status(500).end("Internal Server Error")
    })
  })

  return router;
}
