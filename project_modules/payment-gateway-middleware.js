const debug = require('nice_debug')("PAYMENT_GATEWAY_MIDDLEWARE_DEBUG")
const router = require('express').Router()
const cryptoRandomString = require('crypto-random-string');

const CREATE_ACCOUNT_STATEMENT =
  'INSERT INTO `Accounts` (`account_token`, `account_name`) VALUES (?, ?)'
const QUERY_ACCOUNT_BY_TOKEN =
  'SELECT `account_id`, `account_token`, `account_name` FROM `Accounts` WHERE `account_token` = ?'
const CREATE_COUPON_STATEMENT =
  'INSERT INTO `Coupons` (`coupon_id`, `value`, `currency_symbol`) VALUES (?, ?, ?)'
const CREATE_ACCOUNT_LINK_STATEMENT =
  'INSERT INTO `Account_Links` (`account_id`, `link_type`, `link_data`) VALUES (?, ?, ?)'
const QUERY_ACCOUNT_LINKS =
  'SELECT `link_type`, `link_data` FROM ' +
  '`Accounts` JOIN `Account_Links` ON `Account_Links`.`account_id` = `Accounts`.`account_id` ' +
  'WHERE `Accounts`.`account_id` = ?'
const QUERY_COUPON_VALUE =
  'SELECT `value`, `currency_symbol` FROM `Coupons` WHERE `coupon_id` = ?'
const UPDATE_COUPON_VALUE =
  'UPDATE `Coupons` SET `value` = ? WHERE `coupon_id` = ?'

const ERROR_MESSAGES = {
  ACCOUNT_NOT_FOUND: "account not found",
  ACCOUNT_TOKEN_NOT_VALID: "account token not valid",
  ACCOUNT_NAME_NOT_PROVIDED: "account name not provided",
  PROVIDED_VALUE_IS_NOT_A_NUMBER: "provided value is not a number",
  INVALID_CURRENCY_SYMBOL: "invalid currency symbol",
  INVALID_COUPON_ID: "invalid coupon id",
  COUPON_NOT_FOUND: "coupon not found",
  NOT_ENOUGH_FUNDS: "not enough funds"
}

module.exports = function({ mysqlConnectionPool }) {
  router.post('/create', async function(req, res, next) {
    let args = { ...req.body, ...req.params };
    let [ err, account ] = await createAccount(mysqlConnectionPool, args)
    if(err) {
      handleError(err, res)
      return;
    }

    res.end(JSON.stringify({ account_token: account.account_token }))
  })

  router.get('/account/:account_token', async function(req, res, next) {
    let args = { ...req.body, ...req.params };
    let [ err, account ] = await getAccount(mysqlConnectionPool, args)
    if(err) {
      handleError(err, res);
      return;
    }

    res.end(JSON.stringify({ account_name: account.account_name }))
  })

  //TODO only admins should be able to add coupons without a source with enough funds
  router.post('/add_coupon', async function(req, res, next) {
    let args = { ...req.body, ...req.params };
    let [ err, account ] = await addCoupon(mysqlConnectionPool, args);
    if(err) {
      handleError(err, res);
      return;
    }

    res.end(JSON.stringify( account ))
  })

  router.get('/account_total/:account_token', async function(req, res, next) {
    let args = { ...req.body, ...req.params };

    let [ err, account_total ] = await getAccountTotal(mysqlConnectionPool, args)
    if(err) {
      handleError(err, res)
      return;
    }

    res.end(JSON.stringify(account_total))
  })

  router.post('/transfer', async function(req, res, next) {
    let args = { ...req.body, ...req.params };

    let [ err, successful ] = await transfer(mysqlConnectionPool, args)
    if(err) {
      handleError(err, res)
      return;
    }

    res.end()
  })

  return router;
}

async function transfer( mysqlConnectionPool, args ) {
  const { source_account, destination_account, amount, amount_currency } = args;

  let [ err_on_total, source_account_balance ] =
    await getAccountTotal(mysqlConnectionPool, { account_token: source_account })

  if(err_on_total) {
    return [ err_on_total ]
  }

  if(amount > source_account_balance) {
    return [ new Error(ERROR_MESSAGES.NOT_ENOUGH_FUNDS) ]
  }

  let [ err_on_links , source_account_links ] =
    await getAccountLinks(mysqlConnectionPool, { account_token: source_account })

  if(err_on_links) {
    return [ err_on_links ]
  }

  //// NOTE: ONLY COUPONS ARE VALID FOR TRANSFER
  let source_account_coupon_ids =
    source_account_links
    .filter(link => link.link_type === "coupon")
    .map(link => link.link_data)

  let removed_funds = 0;
  let coupons_to_update = []
  while(removed_funds < amount) {
    let remaining = amount - removed_funds;
    let coupon_id = source_account_coupon_ids.pop()
    let [ err, { value: coupon_value } ] =
      await getCouponValue(mysqlConnectionPool, { coupon_id })
    let coupon_transfer = Math.min(coupon_value, remaining)
    removed_funds = removed_funds + coupon_transfer

    coupons_to_update.push({
      coupon_id, updated_value: coupon_value - coupon_transfer
    })
  }

  debug(1, "transfer", "coupons_to_update", coupons_to_update)
  //TODO in map - as TRANSACTION
  await Promise.all(coupons_to_update.map((update) => {
    mysqlConnectionPool.execute(UPDATE_COUPON_VALUE, [
      update.updated_value, update.coupon_id
    ])
  }))

  await addCoupon(mysqlConnectionPool, {
    destination_account, value: amount, currency_symbol: amount_currency
  })

  return [ null, true ];
}

async function getAccountTotal( mysqlConnectionPool, args ) {
  const { account_token, in_currency } = args;

  const [ err, account_links ] = await getAccountLinks(mysqlConnectionPool, args)
  if(err) {
    return [ err ]
  }

  let all_values =
    await Promise.all(account_links.map(async ({ link_type, link_data }) => {
      if(link_type === "coupon") {
        let [ err, coupon_value ] =
          await getCouponValue(mysqlConnectionPool, { coupon_id: link_data })
        if(err) {
          //HACK:  WHAT HAPPENS IF ONE OF THE PROMISES IN Promise.all REJECTS?
          return { value: 0, currency_symbol: "USD" }
        }
        return coupon_value;
      }
    }))

  let total = all_values.reduce((total, { value, currency_symbol }) => {

    // FIXME: 1. USD should not be hardcoded;
    //        2. convert currencies that aren't the requestd symbol instead of skipping them
    if(currency_symbol !== "USD") {
      return total;
    }
    total.value = total.value + value;
    return total;
  }, { value: 0, currency_symbol: 'USD' })

  debug(1, "getAccountTotal:", "total:", total)
  return [ null, total ]
}

async function getCouponValue( mysqlConnectionPool, args ) {
  const { coupon_id } = args;
  if(!isValidCouponId(coupon_id)) {
    return [ new Error(ERROR_MESSAGES.INVALID_COUPON_ID) ]
  }

  try {
    var [ rows ] = await mysqlConnectionPool.query(QUERY_COUPON_VALUE, [
      coupon_id
    ])
  } catch (err) {
    return [ err ]
  }

  if(rows.length === 0) {
    return [ new Error(ERROR_MESSAGES.COUPON_NOT_FOUND) ]
  }

  return [ null, rows[0] ]
}

async function getAccountLinks( mysqlConnectionPool, args ) {
  const { account_token } = args;

  const [ err, { account_id } ] = await getAccount(mysqlConnectionPool, {
    account_token
  })
  if(err) {
    return [ err ]
  }

  try {
    var [ account_links ] = await mysqlConnectionPool.query(QUERY_ACCOUNT_LINKS, [
      account_id
    ])
  } catch(err) {
    return [ err ]
  }

  return [ null, account_links ];
}

async function addCoupon( mysqlConnectionPool, args ) {
  const { destination_account, value, currency_symbol } = args;

  if(typeof value !== "number") {
    return [ new Error(ERROR_MESSAGES.PROVIDED_VALUE_IS_NOT_A_NUMBER) ];
  }
  if(typeof currency_symbol !== "string") {
    return [ new Error(ERROR_MESSAGES.INVALID_CURRENCY_SYMBOL) ]
  }
  let [ err, account ] = await getAccount(mysqlConnectionPool, {
    account_token: destination_account
  });
  if(err) {
    return [ err ];
  }

  let coupon_id = generateCouponId();
  try {
    await mysqlConnectionPool.execute(CREATE_COUPON_STATEMENT, [
      coupon_id, value, currency_symbol
    ])
  } catch(err) {
    return [ err ]
  }

  try {
    await mysqlConnectionPool.execute(CREATE_ACCOUNT_LINK_STATEMENT, [
      account.account_id, "coupon", coupon_id
    ])
  } catch (err) {
    return [ err ]
  }

  return [ null, account ];
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
    var [ rows ] = await mysqlConnectionPool.query(QUERY_ACCOUNT_BY_TOKEN, [
      account_token
    ])
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
    case ERROR_MESSAGES.NOT_ENOUGH_FUNDS: {
      res.status(403).end("not enough funds for transfer");
      return;
    }
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

function generateCouponId() {
  return cryptoRandomString(64);
}

function generateToken() {
  return cryptoRandomString(128);
}

function isValidCouponId(coupon_id) {
  if(typeof coupon_id !== 'string')
    return false;

  if(coupon_id.length !== 64)
    return false;

  return true;
}

function isAccountTokenValid(account_token) {
  if(typeof account_token !== 'string')
    return false;

  if(account_token.length !== 128)
    return false;

  return true;
}
