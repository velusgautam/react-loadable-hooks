import React from 'react';
import ReactDOM from 'react-dom';
import Loadable from 'react-loadable-hooks';
import App from './components/App';

window.main = () => {
  Loadable.preloadReady().then(() => {
    ReactDOM.hydrate(<App />, document.getElementById('app'));
  });
};
