import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import MainApp from './App';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <Router basename="/hljdext">
      <MainApp />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);
