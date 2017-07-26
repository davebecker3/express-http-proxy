var assert = require('assert');
var express = require('express');
var request = require('supertest');
var proxy = require('../');

function proxyTarget(port, timeout) {
  'use strict';
  var other = express();
  other.get('/', function(req, res) {
    setTimeout(function() {
      res.send('Success');
    },timeout);
  });
  return other.listen(port);
}

describe('honors timeout option', function() {
  'use strict';

  var other, http;
  beforeEach(function() {
    http = express();
    other = proxyTarget(56001, 1000);
  });

  afterEach(function() {
    other.close();
  });

  function assertSuccess(server, done) {
    request(http)
      .get('/')
      .expect(200)
      .end(function(err, res) {
        if (err) { return done(err); }
        assert(res.text === 'Success');
        done();
      });
  }

  function assertConnectionTimeout(server, done) {
    request(http)
      .get('/')
      .expect(408)
      .expect('X-Timout-Reason', 'express-http-proxy timed out your request after 100 ms.')
      .end(function() {
        done();
      });
  }

  describe('when timeout option is set lower than server response time', function() {
    it('should fail with CONNECTION TIMEOUT', function(done) {

      http.use(proxy('http://localhost:56001', {
        timeout: 100,
      }));

      assertConnectionTimeout(http, done);
    });
  });

  describe('when timeout option is set higher than server response time', function() {
    it('should succeed', function(done) {

      http.use(proxy('http://localhost:56001', {
        timeout: 1200,
      }));

      assertSuccess(http, done);
    });
  });

});
