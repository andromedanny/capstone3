// src/App.jsx
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';   

function App() {
  return (
    <Router>
      {/* Include the Header here so it's displayed on all pages */}
      <Header />
      
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
}

export default App;
