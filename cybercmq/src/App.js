import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './home';
import Login from './login';
import Register from './register';
import Game from './game';
import CyberWar from "./attack";

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/game" element={<Game />} />
            <Route path="/attack" element={<CyberWar />} />
        </Routes>
      </Router>
  );
}

export default App;
