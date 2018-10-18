const express = require('express');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const configLoader = require('./config-loader.js')

const config = configLoader({ home_dir: __dirname })

const mysqlConnectionPool = mysql.createPool(config.get('mysql'))

app = express();

async function checkAndStartServer(port) {
  try {
    let [ rows ] = await mysqlConnectionPool.query('select * from `Projects`')
    console.log(`query to db went fine. got ${rows.length} rows`);
  } catch(e) {
    console.error(`error reaching database: ${e.code}. terminating.`)
    process.exit(1);
  }
  app.listen(port, () => {
    console.log(`server started, listening on port ${port}`)
  })
}

checkAndStartServer(config.get('listen-port'))
