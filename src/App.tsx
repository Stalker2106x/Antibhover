import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
//import './Assets/css/weather-icons.min.css';

import Dashboard from './Components/Dashboard';
import Header from './Components/Header';

function App() {
  document.title = "Antibhover";
  return (
    <div className="App">
      <Header />
      <Dashboard />
    </div>
  );
}

export default App;
