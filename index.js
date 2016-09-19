'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var jsonQuery = require("json-query");
var Path = require("path");
var PLUGIN_NAME = "gulp-json-query";

module.exports = function (query, opts) {
	opts = opts || {};
	return through.obj(function (file, enc, cb) {
    var self = this;

		if (file.isNull()) {
			return cb(null, file);
		}

		if (file.isStream()) {
			return cb(new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
		}

    try {
      var data = JSON.parse(file.contents.toString());
      var result = jsonQuery(query,{data: data}).value;
      if(!result) {
        return cb(null, null);
      }
      if(!(result instanceof Array)) {
        result = [result];
      }
      for(var i=0; i<result.length; i++) {
        var out = file.clone({contents: false});
        var outJson = result[i];
        if(typeof(opts.transform)==="function") {
          outJson = opts.transform(outJson, data, i);
        }
        out.contents = new Buffer(JSON.stringify(outJson));
        if(typeof(opts.rename)==="function") {
          out.path = Path.join(file.base, opts.rename(file.relative, result[i], i));
        }
        self.push(out);
      }
    } catch (err) {
      return cb(new gutil.PluginError(PLUGIN_NAME, err));
    }
    cb();
	});
};