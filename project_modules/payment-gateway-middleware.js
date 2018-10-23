const debug = require('nice_debug')("PAYMENT_GATEWAY_MIDDLEWARE_DEBUG")
const router = require('express').Router()
const cryptoRandomString = require('crypto-random-string');

const CREATE_ACCOUNT_STATEMENT =
  'INSERT INTO `Accounts` (`account_token`, `account_name`) VALUES (?, ?)'
const QUERY_ACCOUNT_BY_TOKEN =
  'SELECT `account_name` FROM `Accounts` WHERE `account_token` = ?'
const CREATE_COUPON_STATEMENT =
  'INSERT INTO `Coupons` (`coupon_id`, `value`, `currency_symbol`) VALUES (?, ?, ?)'

const ERROR_MESSAGES = {
  ACCOUNT_NOT_FOUND: "account not found",
  ACCOUNT_TOKEN_NOT_VALID: "account token not valid",
  ACCOUNT_NAME_NOT_PROVIDED: "account name not provided"
}

module.exports = function({ mysqlConnectionPool }) {
  router.post('/create', async function(req, res, next) {
    let [ err, account ] = await createAccount(mysqlConnectionPool, {
      ...req.body, ...req.parmas
    })
    if(err) {
      handleError(err, res)
      return;
    }

    res.end(JSON.stringify({ account_token: account.account_token }))
  })

  router.get('/account/:account_token', async function(req, res, next) {
    let [ err, account ] = await getAccount(mysqlConnectionPool, req.params)
    if(err) {
      handleError(err, res);
      return;
    }

    res.end(JSON.stringify({ account_name: account.account_name }))
  })

  router.post('/add_coupon', function(req, res, next) {
    //TODO only admins should be able to add coupons without a source with enough funds

  })

  return router;
}

async function createAccount( mysqlConnectionPool, args ) {
  debug(2, "createAccount", "args", args)
  let { account_name } = args;
  let account_token = generateToken();
  if(!account_name) {
    return [ new Error(ERROR_MESSAGES.ACCOUNT_NAME_NOT_PROVIDED) ];
  }

  try {
    await mysqlConnectionPool.execute(CREATE_ACCOUNT_STATEMENT, [
      account_token, account_name
    ])
    return [ null, { account_token, account_name } ];
  } catch(e) {
    return [ e ];
  }
}

async function getAccount(mysqlConnectionPool, args) {
  const { account_token } = args;
  if(!isAccountTokenValid(account_token)) {
    return [ new Error("account token not valid") ]
  }

  try {
    var [ rows ] = await mysqlConnectionPool.query(QUERY_ACCOUNT_BY_TOKEN,
      [ account_token ])
  } catch(e) {
    return [ e ]
  }

  if(rows.length === 0) {
    return [ new Error("account not found") ]
  }

  return [ null, rows[0] ]
}

/* ----error handling---- */

function handleError(err, res) {
  debug(1, "handleError:", err.message)
  switch (err.message) {
    case ERROR_MESSAGES.ACCOUNT_NOT_FOUND: {
      res.status(404).end("account not found")
      return;
    }
    case ERROR_MESSAGES.ACCOUNT_TOKEN_NOT_VALID: {
      res.status(400).end("account token not valid")
      return;
    }
    case ERROR_MESSAGES.ACCOUNT_NAME_NOT_PROVIDED: {
      res.status(400).end("account name not provided")
    }
    default: {
      res.status(500).end("Internal server error")
      return;
    }
  }
}

/* ----helpers---- */

function generateToken() {
  return cryptoRandomString(128)
}

function isAccountTokenValid(account_token) {
  if(typeof account_token !== 'string')
    return false;

  if(account_token.length !== 128)
    return false;

  return true;
}
