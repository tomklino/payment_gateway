const chai = require('chai');
const chaiHttp = require('chai-http');
const cp = require("child_process");
const path = require("path");

const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);

testing_db_file_location = path.join(__dirname, "data-for-testing.sql")
mysql_conf_file = path.join(__dirname, "/mysql-testing.cnf")

const config = require('../config-loader.js')()

const port = config.get('listen_port')
const server = "http://localhost:" + port;
const mysql_hostname = config.get('mysql:host')
const mysql_database = config.get('mysql:database')

const testData = {
  "none_existing_account": "a4331b4a31656821e5731ce31151202c00c706e2c316e8a0a04acd13086af59cf68d94bc22ea78c67c13692ac0b43aa8e409d420d18a5f0b0bf41456658f0e68",
  "existing_test_account": "c72bc564d79446b88912d126bde382e71664addaeb48b5db43ffc87b09edd4e29c56d1933fb495457618614f7853b0189ed296387d674c8c3a4b70e8015ea19a"

}

function resetDB() {
  command =
    "mysql" +
    " --defaults-extra-file=" + mysql_conf_file +
    " --host " + mysql_hostname +
    " -D " + mysql_database +
    " < " + testing_db_file_location;
  cp.execSync(command);
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
      .send({ account_name: "test_account_1"})
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
})
