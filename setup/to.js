'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

exports.to = function (promise) {
  return promise.then(function (data) {
      return [null, data];
    }, function (rejected) {
      return [rejected];
    })
    .catch(function (err) {
      return [err];
    });
};