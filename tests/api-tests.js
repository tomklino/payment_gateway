const chai = require('chai');
const chaiHttp = require('chai-http');
const cp = require("child_process");
const path = require("path");
const mysql = require('mysql2/promise');
const fs = require('fs');

const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);

testing_db_file_location = path.join(__dirname, "data-for-testing.sql")
mysql_conf_file = path.join(__dirname, "/mysql-testing.cnf")
mysql_data_for_testing = fs.readFileSync(testing_db_file_location, 'utf8')

const config = require('../config-loader.js')()

const port = config.get('listen_port')
const address = config.get('listen_address')
const server = `http://${address}:${port}`;

const mysql_connect_arguments = {
  host: config.get('mysql:host'),
  user: config.get('mysql:user'),
  database: config.get('mysql:database'),
  password: config.get('mysql:password'),
  multipleStatements: true
}

const testData = {
  "none_existing_account": "a4331b4a31656821e5731ce31151202c00c706e2c316e8a0a04acd13086af59cf68d94bc22ea78c67c13692ac0b43aa8e409d420d18a5f0b0bf41456658f0e68",
  "existing_test_account": "c72bc564d79446b88912d126bde382e71664addaeb48b5db43ffc87b09edd4e29c56d1933fb495457618614f7853b0189ed296387d674c8c3a4b70e8015ea19a",
  "test_account_1":        "7439596a2ff91840b1469e0580be05a81d844c94e2b9b017d927dcbdbefe4bd9ec9873ab2ba6729922f77ffba2dd47eec864935fdc9fa71e1a9f7a28ed103de5",
  "test_account_2":        "8eb17747ceefb5add442687c09dd0b537dcd71667cfa345c14676d86c58696f475ec44956ab204846d21f5dd9b669d53f9f941a45fbf36c8c10e19cf2157073d"
}

async function resetDB() {
  const connection = await mysql.createConnection(mysql_connect_arguments);
  await connection.query(mysql_data_for_testing);
  await connection.end();
}

describe("server health check", function() {
  it("should report 200 OK as response to health check", function(done) {
    chai.request(server).get('/health').then((res) => {
      expect(res).to.have.status(200)
      done()
    })
  })
})

describe("api tests", function() {
  this.timeout(9000) //resetting the state of the database might take long
  beforeEach(resetDB);
  after(resetDB);

  it("should create an account and return token", function(done) {
    chai.request(server)
      .post('/create')
      .send({ account_name: "test_account_x"})
      .then((res) => {
        expect(res).to.have.status(200)
        let body = JSON.parse(res.text)
        expect(body.account_token).to.be.a('string')
        expect(body.account_token.length).to.equal(128)
        done()
      }).catch((err) => {
        done(err)
      })
  })

  it("should return a 400 status when trying to create an account with no name", function(done) {
    chai.request(server)
      .post('/create')
      .then((res) => {
        expect(res).to.have.status(400)
        done();
      })
      .catch((err) => {
        done(err)
      })
  })

  it("should return a 404 when quering for a token that does not exist", function(done) {
    chai.request(server)
      .get('/account/' + testData.none_existing_account)
      .then((res) => {
        expect(res).to.have.status(404);
        done();
      })
      .catch((err) => {
        done(err);
      })
  })

  it("should return an object containing the account name", function(done) {
    chai.request(server)
      .get('/account/' + testData.existing_test_account)
      .then((res) => {
        expect(res).to.have.status(200);
        let body = JSON.parse(res.text)
        expect(body.account_name).to.be.a('string')
        done();
      })
      .catch((err) => {
        done(err)
      })
  })

  it("should create a coupon and link it to an account", function(done) {
    chai.request(server)
      .post('/add_coupon')
      .send({
        destination_account: testData.existing_test_account,
        value: 10,
        currency_symbol: "USD"
      })
      .then((res) => {
        expect(res).to.have.status(200);
        done();
      })
      .catch((e) => {
        done(e);
      })
  })

  it("should return the total of an account in USD", function(done) {
    chai.request(server)
      .get('/account_total/' + testData.existing_test_account)
      .then((res) => {
        expect(res).to.have.status(200)
        let body = JSON.parse(res.text)
        expect(body.value).to.be.a('number');
        expect(body.currency_symbol).to.be.a('string');
        done();
      })
      .catch((err) => {
        done(err);
      })
  })

  //TODO create a more complex scenrio for the tests
  // 1. transfer more than the value of the first coupon (with enough funds)
  // 2. transfer with more than the available funds - and expect an error (403)
  it("should transfer 10$ from source account to destination account", async function() {
    var transfer_response =
    await chai.request(server)
      .post('/transfer')
      .send({
        source_account: testData.test_account_1,
        destination_account: testData.test_account_2,
        amount: 10,
        amount_currency: "USD"
      })

    var total_src_account_response =
    await chai.request(server)
      .get('/account_total/' + testData.test_account_1)

    let total_src_account_response_body = JSON.parse(total_src_account_response.text)

    var total_dst_account_response =
    await chai.request(server)
      .get('/account_total/' + testData.test_account_2)

    let total_dst_account_response_body = JSON.parse(total_dst_account_response.text)

    expect(transfer_response).to.have.status(200)
    expect(total_src_account_response_body.value).to.equal(0)
    expect(total_dst_account_response_body.value).to.equal(10)
  })

  it("should transfer 5$ from source account to destination account", async function() {
    var transfer_response =
    await chai.request(server)
      .post('/transfer')
      .send({
        source_account: testData.test_account_1,
        destination_account: testData.test_account_2,
        amount: 5,
        amount_currency: "USD"
      })

    var total_src_account_response =
    await chai.request(server)
      .get('/account_total/' + testData.test_account_1)

    let total_src_account_response_body = JSON.parse(total_src_account_response.text)

    var total_dst_account_response =
    await chai.request(server)
      .get('/account_total/' + testData.test_account_2)

    let total_dst_account_response_body = JSON.parse(total_dst_account_response.text)

    expect(transfer_response).to.have.status(200)
    expect(total_src_account_response_body.value).to.equal(5)
    expect(total_dst_account_response_body.value).to.equal(5)
  })
})
