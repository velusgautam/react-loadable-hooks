import React from 'react';
import Loadable from 'react-loadable-hooks';
import Loading from './Loading';

const LoadableExample = Loadable({
  loader: () => import('./Example'),
  loading: Loading,
});

export default function App() {
  return <LoadableExample />;
}
