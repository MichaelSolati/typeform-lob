'use strict';

const r = require('request');

Object.defineProperty(exports, '__esModule', { value: true });

exports.requestPromise = function (options) {
    return new Promise(function (res, rej) {
        r(options, function (error, response, body) {
            if (error || response.statusCode >= 400) {
                rej(JSON.parse(body.toString()));
            }
            res(JSON.parse(body.toString()));
        });
    });
};
