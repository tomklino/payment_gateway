const debug = require('nice_debug')("PAYMENT_GATEWAY_MIDDLEWARE_DEBUG")
const router = require('express').Router()
const cryptoRandomString = require('crypto-random-string');

const CREATE_ACCOUNT_STATEMENT =
  'INSERT INTO `Accounts` (`account_token`, `account_name`) VALUES (?, ?)'
const QUERY_ACCOUNT_BY_TOKEN =
  'SELECT `account_name` FROM `Accounts` WHERE `account_token` = ?'

function generateToken() {
  return cryptoRandomString(128)
}

module.exports = function({ mysqlConnectionPool }) {
  router.post('/create', function(req, res, next) {
    let account_token = generateToken();
    let account_name = req.body.account_name;
    if(!account_name) {
      debug(1, "account_name not provided while requesting to create account");
      res.status(400).end("account name must be provided")
      return;
    }
    mysqlConnectionPool.execute(CREATE_ACCOUNT_STATEMENT, [
      account_token, account_name
    ])
    .then(() => {
      res.end(JSON.stringify({ token: account_token }))
    })
    .catch((e) => {
      debug(1, "error while trying to create account:", e)
      res.status(500).end("Internal Server Error")
    })
  })

  router.get('/account/:account_token', function(req, res, next) {
    let account_token = req.params.account_token;
    if(!isAccountTokenValid(account_token)) {
      debug(1, "account token is not valid")
      res.status(400).end("invalid account token")
      return;
    }

    mysqlConnectionPool.query(QUERY_ACCOUNT_BY_TOKEN, [ account_token ])
      .then(([ rows ]) => {
        if(rows.length === 0) {
          debug(1, "provided account_token not found in database")
          res.status(404).end("account not found")
          return;
        }

        res.end(JSON.stringify({ account_name: rows[0].account_name }))
      })
      .catch((e) => {
        debug(1, "error while trying to query account:", e)
        res.status(500).end("Internal Server Error")
      })
  })
  return router;
}

function isAccountTokenValid(account_token) {
  if(typeof account_token !== 'string')
    return false;

  if(account_token.length !== 128)
    return false;

  return true;
}
