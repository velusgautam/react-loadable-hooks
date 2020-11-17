"use strict";

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var React = require("react");

var ALL_INITIALIZERS = [];
var READY_INITIALIZERS = [];

function isWebpackReady(getModuleIds) {
  if (typeof __webpack_modules__ !== "object") {
    return false;
  }

  return getModuleIds().every(function (moduleId) {
    return typeof moduleId !== "undefined" && typeof __webpack_modules__[moduleId] !== "undefined";
  });
}

function load(loader) {
  var promise = loader();
  var state = {
    loading: true,
    loaded: null,
    error: null
  };
  state.promise = promise.then(function (loaded) {
    state.loading = false;
    state.loaded = loaded;
    return loaded;
  })["catch"](function (err) {
    state.loading = false;
    state.error = err;
    throw err;
  });
  return state;
}

function loadMap(obj) {
  var state = {
    loading: false,
    loaded: {},
    error: null
  };
  var promises = [];

  try {
    Object.keys(obj).forEach(function (key) {
      var result = load(obj[key]);

      if (!result.loading) {
        state.loaded[key] = result.loaded;
        state.error = result.error;
      } else {
        state.loading = true;
      }

      promises.push(result.promise);
      result.promise.then(function (res) {
        state.loaded[key] = res;
      })["catch"](function (err) {
        state.error = err;
      });
    });
  } catch (err) {
    state.error = err;
  }

  state.promise = Promise.all(promises).then(function (res) {
    state.loading = false;
    return res;
  })["catch"](function (err) {
    state.loading = false;
    throw err;
  });
  return state;
}

function resolve(obj) {
  return obj && obj.__esModule ? obj["default"] : obj;
}

function render(loaded, props) {
  return React.createElement(resolve(loaded), props);
}

function createLoadableComponent(loadFn, options) {
  if (!options.loading) {
    throw new Error("react-loadable requires a `loading` component");
  }

  var opts = _extends({
    loader: null,
    loading: null,
    delay: 200,
    timeout: null,
    render: render,
    webpack: null,
    modules: null
  }, options);

  var res = null;

  function init() {
    if (!res) {
      res = loadFn(opts.loader);
    }

    return res.promise;
  }

  ALL_INITIALIZERS.push(init);

  if (typeof opts.webpack === "function") {
    READY_INITIALIZERS.push(function () {
      if (isWebpackReady(opts.webpack)) {
        return init();
      }
    });
  }

  var Loadable = React.createContext({
    report: function report() {}
  });
  return function LoadableComponent(props) {
    init();

    var _React$useState = React.useState({
      error: res.error,
      pastDelay: false,
      timedOut: false,
      loading: res.loading,
      loaded: res.loaded
    }),
        state = _React$useState[0],
        setState = _React$useState[1];

    var mounted = React.useRef();
    var loadable = React.useContext(Loadable);
    var delay, timeout;
    React.useEffect(function () {
      mounted.current = true;
      loadModule();
      return function () {
        mounted.current = false;
        clearTimeouts();
      };
    });

    function loadModule() {
      if (loadable && Array.isArray(opts.modules)) {
        opts.modules.forEach(function (moduleName) {
          loadable.report(moduleName);
        });
      }

      if (!res.loading) {
        return;
      }

      if (typeof opts.delay === "number") {
        if (opts.delay === 0) {
          setState({
            pastDelay: true
          });
        } else {
          delay = setTimeout(function () {
            setState({
              pastDelay: true
            });
          }, opts.delay);
        }
      }

      if (typeof opts.timeout === "number") {
        timeout = setTimeout(function () {
          setState({
            timedOut: true
          });
        }, opts.timeout);
      }

      var update = function update() {
        if (!mounted.current) {
          return;
        }

        setState({
          error: res.error,
          loaded: res.loaded,
          loading: res.loading
        });
        clearTimeouts();
      };

      res.promise.then(function () {
        update();
        return null;
      })["catch"](function (err) {
        update();
        return null;
      });
    }

    function clearTimeouts() {
      clearTimeout(delay);
      clearTimeout(timeout);
    }

    var retry = function retry() {
      setState({
        error: null,
        loading: true,
        timedOut: false
      });
      res = loadFn(opts.loader);
      loadModule();
    };

    if (state.loading || state.error) {
      return React.createElement(opts.loading, {
        isLoading: state.loading,
        pastDelay: state.pastDelay,
        timedOut: state.timedOut,
        error: state.error,
        retry: retry
      });
    } else if (state.loaded) {
      return opts.render(state.loaded, props);
    } else {
      return null;
    }
  };
}

function Loadable(opts) {
  return createLoadableComponent(load, opts);
}

function LoadableMap(opts) {
  if (typeof opts.render !== "function") {
    throw new Error("LoadableMap requires a `render(loaded, props)` function");
  }

  return createLoadableComponent(loadMap, opts);
}

Loadable.Map = LoadableMap;

function Capture(props) {
  return React.Children.only(props.children);
}

Loadable.Capture = Capture;

function flushInitializers(initializers) {
  var promises = [];

  while (initializers.length) {
    var init = initializers.pop();
    promises.push(init());
  }

  return Promise.all(promises).then(function () {
    if (initializers.length) {
      return flushInitializers(initializers);
    }
  });
}

Loadable.preloadAll = function () {
  return new Promise(function (resolve, reject) {
    flushInitializers(ALL_INITIALIZERS).then(resolve, reject);
  });
};

Loadable.preloadReady = function () {
  return new Promise(function (resolve, reject) {
    // We always will resolve, errors should be handled within loading UIs.
    flushInitializers(READY_INITIALIZERS).then(resolve, resolve);
  });
};

module.exports = Loadable;