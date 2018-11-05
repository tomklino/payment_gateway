const nconf = require('nconf');

module.exports = function configLoader(options) {
  options = options || {};
  const { home_dir = __dirname } = options;

  nconf
    .argv()
    .env('__')

  nconf.file('config', {
    file: nconf.get('CONFIG_FILE') || home_dir + '/config.json'
  })

  nconf.file('secrets', {
    file: nconf.get('SECRETS_FILE') || home_dir + '/secret_settings.json'
  })

  nconf.file('defaults', {
    file: home_dir + '/config.defaults.json'
  })

  return nconf;
}
