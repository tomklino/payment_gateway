const express = require('express');
const mysql = require('mysql2/promise');
const configLoader = require('./config-loader.js')
const payment_api = require('./project_modules/payment-gateway-middleware.js')

const config = configLoader({ home_dir: __dirname })

const mysqlConnectionPool = mysql.createPool(config.get('mysql'))

app = express();

app.get('/health', function(req, res) {
  res.end("healthy")
})

app.use(payment_api({ mysqlConnectionPool }))

app.use(function(req, res) {
  res.status(404).send()
})

async function checkAndStartServer(port) {
  try {
    let [ rows ] = await mysqlConnectionPool.query('select * from `Accounts`')
    console.log(`query to db went fine. got ${rows.length} rows`);
  } catch(e) {
    console.error(`error reaching database: ${e.code}. terminating.`)
    process.exit(1);
  }
  app.listen(port, () => {
    console.log(`server started, listening on port ${port}`)
  })
}

checkAndStartServer(config.get('listen_port'))
