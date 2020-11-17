'use strict';

function _createForOfIteratorHelperLoose(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; return function () { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } it = o[Symbol.iterator](); return it.next.bind(it); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var url = require('url');

function buildManifest(compiler, compilation) {
  var context = compiler.options.context;
  var manifest = {};
  compilation.chunks.forEach(function (chunk) {
    chunk.files.forEach(function (file) {
      for (var _iterator = _createForOfIteratorHelperLoose(chunk.modulesIterable), _step; !(_step = _iterator()).done;) {
        var module = _step.value;
        var id = module.id;
        var name = typeof module.libIdent === 'function' ? module.libIdent({
          context: context
        }) : null;
        var publicPath = url.resolve(compilation.outputOptions.publicPath || '', file);
        var currentModule = module;

        if (module.constructor.name === 'ConcatenatedModule') {
          currentModule = module.rootModule;
        }

        if (!manifest[currentModule.rawRequest]) {
          manifest[currentModule.rawRequest] = [];
        }

        manifest[currentModule.rawRequest].push({
          id: id,
          name: name,
          file: file,
          publicPath: publicPath
        });
      }

      ;
    });
  });
  return manifest;
}

var ReactLoadablePlugin = /*#__PURE__*/function () {
  function ReactLoadablePlugin(opts) {
    if (opts === void 0) {
      opts = {};
    }

    this.filename = opts.filename;
  }

  var _proto = ReactLoadablePlugin.prototype;

  _proto.apply = function apply(compiler) {
    var _this = this;

    compiler.plugin('emit', function (compilation, callback) {
      var manifest = buildManifest(compiler, compilation);
      var json = JSON.stringify(manifest, null, 2);
      compilation.assets[_this.filename] = {
        source: function source() {
          return json;
        },
        size: function size() {
          return json.length;
        }
      };
      callback();
    });
  };

  return ReactLoadablePlugin;
}();

function getBundles(manifest, moduleIds) {
  return moduleIds.reduce(function (bundles, moduleId) {
    return bundles.concat(manifest[moduleId]);
  }, []);
}

exports.ReactLoadablePlugin = ReactLoadablePlugin;
exports.getBundles = getBundles;