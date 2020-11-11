const base = __dirname;

const env = {
   base: base,
   debug: !!process.env.TEMPLATESERVER_DEBUG,
   auth_internal: false,
   search_path: process.env.TEMPLATESERVER_SEARCH_PATH,
   ldap_server: process.env.TEMPLATESERVER_LDAP_SERVER,
   keyval: {
      // store key value into file;
      // if null, only in memory
      filename: process.env.TEMPLATESERVER_KEYVAL_FILENAME || null,
      authfile: process.env.TEMPLATESERVER_AUTH_FILENAME || null,
   },
   offer: {
      serve_static: true,
   },
   admins: process.env.TEMPLATESERVER_ADMINS?process.env.TEMPLATESERVER_ADMINS.split(','):[],
};

module.exports = env;
