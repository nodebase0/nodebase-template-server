const i_path = require('path');
const i_fs = require('fs');

const helper = {
   fs: {
      getStat: async (filename) => {
         return new Promise((r, e) => {
            i_fs.lstat(filename, (err, stat) => {
               if (err) return e(err);
               r(stat);
            });
         });
      }, // getState
      makeDir: async (dirname) => {
         try {
            let stat = await helper.fs.getStat(dirname);
            if (stat.isDirectory()) return;
         } catch(e) {}

         let parentDir = i_path.dirname(dirname);
         await helper.fs.makeDir(parentDir);

         return new Promise((r, e) => {
            i_fs.mkdir(dirname, (err) => {
               if (err) return e(err);
               r();
            });
         });
      }, // makeDir
      unlinkDir: async (dirname) => {
         let list = await helper.fs.readDir(dirname).map((name) => ({ name }));
         for (let i = 0, n = list.length; i < n; i++) {
            let item = list[i];
            let filename = i_path.join(dirname, item.name);
            item.stat = await helper.fs.getStat(filename);
            if (item.stat && item.stat.isDirectory()) {
               await helper.fs.unlinkDir(filename);
            } else {
               await helper.fs.unlinkFile(filename);
            }
         }
         return new Promise((r, e) => {
            i_fs.rmdir(dirname, (err) => {
               if (err) return e(err);
               r();
            });
         });
      }, // unlinkDir
      readDir: async (dirname) => {
         return new Promise((r, e) => {
            i_fs.readdir(dirname, (err, list) => {
               if (err) return e(err);
               r(list);
            });
         });
      }, // readDir
      readFile: async (filename) => {
         return new Promise((r, e) => {
            i_fs.readFile(filename, (err, data) => {
               if (err) return e(err);
               r(data);
            });
         });
      }, // readFile
      writeFile: async (filename, data) => {
         return new Promise((r, e) => {
            i_fs.writeFile(filename, data, (err) => {
               if (err) return e(err);
               r();
            });
         });
      },
      unlinkFile: async (filename) => {
         return new Promise((r, e) => {
            i_fs.unlink(filename, (err) => {
               if (err) return e(err);
               r();
            });
         });
      }, // unlinkFile
   }, // fs
};

class FSKeyval {
   constructor(baseDir) {
      this.baseDir = i_path.resolve(baseDir);
      this.tasks = [];
      this.taskBusy = false;
   }

   validateKey(key) {
      key = key.filter((x) => x !== '..');
      return key;
   }

   async set(key, val) {
      // key = [part1, part2, ...]
      // val = JSON{}
      key = this.validateKey(key);
      if (!key.length) throw new Exception('[FSKeyval.set] key is empty.');
      let filename = i_path.join(this.baseDir, ...key.map((x) => encodeURIComponent(x)));
      let dirname = i_path.dirname(filename);
      try {
         await helper.fs.makeDir(dirname);
         await helper.fs.writeFile(filename, JSON.stringify(val));
      } catch (e) {
         throw e;
      }
   }

   async get(key) {
      key = this.validateKey(key);
      if (!key.length) throw new Exception('[FSKeyval.get] key is empty.');
      let filename = i_path.join(this.baseDir, ...key.map((x) => encodeURIComponent(x)));
      try {
         let data = await helper.fs.readFile(filename);
         return JSON.parse(data);
      } catch (e) {
         throw e;
      }
   }

   async list(key) {
      key = this.validateKey(key);
      if (!key.length) throw new Exception('[FSKeyval.list] key is empty.');
      let filename = i_path.join(this.baseDir, ...key.map((x) => encodeURIComponent(x)));
      try {
         let data = await helper.fs.readDir(filename);
         return data;
      } catch(e) {
         throw e;
      }
   }

   async del(key) {
      key = this.validateKey(key);
      if (!key.length) throw new Exception('[FSKeyval.get] key is empty.');
      let filename = i_path.join(this.baseDir, ...key.map((x) => encodeURIComponent(x)));
      try {
         return await helper.fs.unlinkFile(filename);
      } catch (e) {
         throw e;
      }
   }

   seqSet (key, val) {
      this.tasks.push({ key, val });
      this.seqAct();
   }

   seqDel (key) {
      this.tasks.push({ key });
      this.seqAct();
   }

   seqAct (resolve, reject, self) {
      if (!self) self = this;
      if (!self.tasks.length) return;
      if (self.taskBusy) return;
      self.taskBusy = true;
      let task = self.task.shift();
      if (task) {
         if (task.key && task.val) {
            self.set(task.key, task.val).then(() => {
               next();
            }, () => {
               console.log('[FSKeyval.seqSet] failed:', task.key, task.val);
               next();
            });
         } else if (task.key) {
            self.del(task.key).then(() => {
               next();
            }, () => {
               console.log('[FSKeyval.seqDel] failed:', task.key);
               next();
            });
         }
      }
      next();

      function next () {
         self.taskBusy = false;
         setTimeout(self.seqAct, 0, resolve, reject, self);
      }
   }
}

module.exports = {
   helper,
   DefaultStorage: FSKeyval,
   FSKeyval,
}
