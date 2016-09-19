var gutil = require("gulp-util");
var assert = require('assert');
var util = require("util");
var path = require("path");
var stream = require("stream");
var jsonQuery = require("../index.js");

var data = {
  management: [
    {name: 'Margaret', country: "IN"},
    {name: 'Gregor', country: "FI"},
  ], 
  staff: [
    {name: 'Matt', country: 'NZ'},
    {name: 'Pete', country: 'AU'},
    {name: 'Mikey', country: 'NZ'}
  ]
};

describe('gulp-json-query', function() {
  describe("querying", function(){
    describe("with no result", function(){
      it("should return no file in stream", function(done){
        var stream = jsonQuery("deadbeef");
        stream.end(new gutil.File({
          contents: new Buffer(JSON.stringify(data))
        }));
        stream.once('data', function(file) {
          throw new Error("Expected empty stream");
        });
        stream.on('end', done);
      });
    });
    describe("with single result", function(){
      it("should return file with result in stream", function(done){
        var stream = jsonQuery("staff[0]");
        stream.end(new gutil.File({
          contents: new Buffer(JSON.stringify(data))
        }));
        var count = 0;
        stream.on('data', function(file) {
          var json = JSON.parse(file.contents);
          assert.equal(json.name,"Matt");
          count++;
        });
        stream.on("end", function(){
          assert.equal(count, 1, "Expected sinle file in stream")
          done();
        })
      });
    });
    describe("with multiple results", function(){
      it("should return multiple files in stream", function(done){
        var stream = jsonQuery("staff");
        stream.end(new gutil.File({
          contents: new Buffer(JSON.stringify(data))
        }));
        var count = 0;
        stream.on('data', function(file) {
          count++;
        });
        stream.on("end", function(){
          assert.equal(count, 3, "Expected three files in stream")
          done();
        })
      });
    });
  });

  describe("with transform option", function() {
    it("it should pass result, source and index to transform function", function(done){
      var called = false;
      var stream = jsonQuery("staff[0]", {
        transform: function(result, source, idx) {
          assert.deepEqual(result, data.staff[0]);
          assert.deepEqual(source, data);
          assert.equal(idx,0);
          called = true;
          return result
        }
      });
      stream.end(new gutil.File({
        base: "/test",
        path: "/test/random/input.json",
        contents: new Buffer(JSON.stringify(data)),
      }));
      stream.once("data", function(){});
      stream.on("end", function(){
        assert.ok(called);
        done();
      });
    });
    it("it should replace result with return value from transform function", function(done){
      var called = false;
      var stream = jsonQuery("staff[0]", {
        transform: function(result, source, idx) {
          return {"answer":42}
        }
      });
      stream.end(new gutil.File({
        base: "/test",
        path: "/test/random/input.json",
        contents: new Buffer(JSON.stringify(data)),
      }));
      stream.once("data", function(file){
        var json = JSON.parse(file.contents.toString());
        assert.deepEqual(json, {answer: 42});
      });
      stream.on("end", done);
    });
  });
  describe("with rename option", function() {
    it("it should pass path, result, and index to rename function", function(done){
      var called = false;
      var stream = jsonQuery("staff[0]", {
        rename: function(path, result, idx) {
          assert.deepEqual(result, data.staff[0]);
          assert.equal(idx,0);
          assert.equal(path, "random/input.json");
          called = true;
          return path;
        }
      });
      stream.end(new gutil.File({
        base: "/test",
        path: "/test/random/input.json",
        contents: new Buffer(JSON.stringify(data)),
      }));
      stream.once("data", function(){});
      stream.on("end", function(){
        assert.ok(called);
        done();
      });
    });

    it("it should set update path to the result of rename function", function(done){
      var stream = jsonQuery("staff[0]", {
        rename: function(path, result, idx) {
          return "random.json";
        }
      });
      stream.end(new gutil.File({
        base: "/test",
        path: "/test/random/input.json",
        contents: new Buffer(JSON.stringify(data))
      }));
      stream.once("data", function(file){
        assert.equal(file.path, "/test/random.json");
      });
      stream.on("end", done);
    });
  });
});