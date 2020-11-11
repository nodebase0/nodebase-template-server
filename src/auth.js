const i_fs = require('fs');
const i_uuid = require('uuid');
const i_keyval = require('./keyval');
const i_env = require('./env');

const system = {
   authfile: {
      lock: false,
   },
};

const api = {
   authenticate: async (username, password) => {
      // no auth
      // ldap integration: api.authenticate = api.authenticate_for_ldap
      let r = null;
      if (i_env.ldap_server) {
         r = await api.authenticate_for_ldap(username, password);
      } else if (i_env.keyval.authfile) {
         r = await api.authenticate_for_authfile(username, password);
      } else {
         // if disable auth file, no auth
         return keyval_setauth(username);
      }
      if (r.error) throw r;
      return r;
   },
   check_login: (username, uuid) => {
      let meta = i_keyval.get(keyval_authkey(username, uuid));
      if (!meta) return null;
      // keep login
      meta.login = new Date().getTime();
      return meta;
   },
   authenticate_for_ldap: async (username, password) => {
      /*const i_ldap = require('ldapjs');
      let client = i_ldap.createClient({
         url: i_env.ldap_server
      });
      client.bind(username, password, (error) => {
         client.unbind();
         if (error) {
            return {username, error};
         } else {
            return keyval_setauth(username);
         }
      });*/
      return {username, error: 'NotSupported'};
   },
   authenticate_for_authfile: async (username, password) => {
      const i_fs = require('fs');
      const i_crypto = require('crypto');
      try {
         if (!username || !password) throw 'AuthFailure';
         if (!i_fs.existsSync(i_env.keyval.authfile)) throw 'NoAuth';
         let whitelist = JSON.parse(i_fs.readFileSync(i_env.keyval.authfile));
         if (!whitelist) throw 'NoAuth';
         let hash_sha256, hash_md5;
         hash_sha256 = i_crypto.createHash('sha256');
         hash_md5 = i_crypto.createHash('md5');
         hash_sha256.update(password);
         hash_md5.update(password);
         let phash_sha256 = hash_sha256.digest('hex');
         let phash_md5 = hash_md5.digest('hex');
         let fhash = `${phash_sha256}${phash_md5}`;
         hash_sha256 = i_crypto.createHash('sha256');
         hash_md5 = i_crypto.createHash('md5');
         hash_sha256.update(fhash);
         hash_md5.update(fhash);
         phash_sha256 = hash_sha256.digest('hex');
         phash_md5 = hash_md5.digest('hex');
         fhash = `${phash_sha256}${phash_md5}`;
         if (!whitelist[username]) throw 'NoUser';
         if (whitelist[username] !== fhash) throw 'AuthFailure';
         return resolve(keyval_setauth(username));
      } catch (error) {
         if (typeof(error) !== 'string') error = 'NoAuth';
         return {username, error};
      }
   },
   clear: (username, uuid) => {
      return i_keyval.set(keyval_authkey(username, uuid));
   },
   keyval_setauth,
   keyval_authkey,
};

function keyval_authkey(username, uuid) {
   return `auth.${username}.${uuid}`;
}

function keyval_setauth(username, login_timestamp) {
   let keys = i_keyval.keys(`auth.${username}.*`);
   keys.forEach((key) => {
      i_keyval.set(key, null);
   });
   let meta = {
      login: login_timestamp || new Date().getTime()
   };
   let uuid = i_uuid.v4();
   i_keyval.set(keyval_authkey(username, uuid), meta);
   return {username, uuid};
}

module.exports = api;
