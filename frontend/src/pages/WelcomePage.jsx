// src/pages/WelcomePage.jsx
import { Link } from 'react-router-dom';

const WelcomePage = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-blue-500 text-white">
      <h1 className="text-4xl font-bold mb-6">Welcome to Our Website!</h1>
      <p className="text-xl mb-8">Please login to continue</p>
      <Link
        to="/login"
        className="bg-white text-blue-500 py-2 px-6 rounded-lg text-lg font-semibold"
      >
        Log In
      </Link>
    </div>
  );
};

export default WelcomePage;
