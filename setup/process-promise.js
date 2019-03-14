'use strict';

const { exec } = require('child_process');

Object.defineProperty(exports, '__esModule', { value: true });

exports.processPromise = function (command) {
    return new Promise(function (res, rej) {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.log(error);
          rej(error)
          return;
        }
        res({ stdout, stderr });
      });
    });
};
