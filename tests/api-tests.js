const chai = require('chai');
const chaiHttp = require('chai-http');
const cp = require("child_process");
const path = require("path");
const fs = require("fs");

const should = chai.should();
const expect = chai.expect;

chai.use(chaiHttp);

testing_db_file_location = path.join(__dirname, "data-for-testing.sql")
mysql_conf_file = path.join(__dirname, "/mysql-testing.cnf")

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "config.json")));
const port = config.listen_port || "3000";
const server = "http://localhost:" + port;
const mysql_hostname =
  process.env['MYSQL_HOSTNAME'] || config.mysql.host || "127.0.0.1";
const mysql_database =
  process.env['MYSQL_DATABASE'] || config.mysql.database;

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
  beforeEach(resetDB);
  after(resetDB);

  it("should create an account and return token", function(done) {
    chai.request(server)
      .post('/create/test_account')
      .then((res) => {
        expect(res).to.have.status(200)
        let body = JSON.parse(res.text)
        expect(body.token).to.be.a('string')
        expect(body.token.length).to.equal(128)
        done()
      }).catch((res) => {
        done(res)
      })
  })
})
