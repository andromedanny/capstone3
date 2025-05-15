import React from 'react';
import { Link } from 'react-router-dom';

const PublicHeader = () => {
  return (
    <header className="relative z-50">
      <div className="flex items-center justify-between fixed top-0 left-0 w-full bg-white shadow-md p-4">
        {/* Logo + Brand Name Container */}
        <div className="flex items-center space-x-2">
          <img src="/webicon.png" alt="Logo" className="w-12 h-12 object-contain" />
          <Link to="/" className="text-xl font-semibold text-blue-600 hover:text-blue-800">
            Structura
          </Link>
        </div>

        {/* Right Navigation Section */}
        <div className="flex items-center space-x-6">
          <Link to="/about" className="text-gray-600 hover:text-gray-800">
            About
          </Link>
          <Link to="/login" className="text-gray-600 hover:text-gray-800">
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader; 