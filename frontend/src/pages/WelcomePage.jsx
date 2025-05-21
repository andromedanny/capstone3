// src/pages/WelcomePage.jsx
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';

const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="flex flex-col justify-center items-center h-screen text-gray-800">
        <h1 className="text-5xl font-bold mb-6">Welcome to Structura</h1>
        <p className="text-2xl mb-8 text-gray-600">Your one-stop platform for creating beautiful online stores</p>
        <Link
          to="/login"
          className="bg-indigo-600 text-white py-3 px-8 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition duration-200 shadow-lg"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
};

export default WelcomePage;
