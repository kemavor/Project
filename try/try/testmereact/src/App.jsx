import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import AuthPage from "./login";
import Home from "./home";

const App = () => {
  return (
    <Router>
      <nav>
        <Link to="/auth">Login/Register</Link> | <Link to="/home">Home</Link>
      </nav>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;