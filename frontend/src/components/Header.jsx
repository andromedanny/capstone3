import React from 'react';

const Header = () => {
  return (
    <header className="relative z-50">
      <div className="flex items-center justify-between fixed top-0 left-0 w-full bg-white shadow-md p-4 kvKTn7 UH0jnE tBeqpV">
        
        {/* Logo + Brand Name Container */}
        <div className="flex items-center space-x-2 pEcvKh">
          <img src="/webicon.png" alt="Logo" className="w-12 h-12 object-contain" />
          <a href="/" className="Odr5ld J8tRBr text-xl font-semibold text-blue-600 hover:text-blue-800">
            Structura
          </a>
        </div>

        {/* Main Navigation Area */}
        <nav className="nolnRs flex space-x-8">
          <a href="/about" className="text-lg text-gray-600 hover:text-gray-800">
            About
          </a>
          <a href="/services" className="text-lg text-gray-600 hover:text-gray-800">
            Services
          </a>
          <a href="/contact" className="text-lg text-gray-600 hover:text-gray-800">
            Contact
          </a>
        </nav>

        {/* Additional Navigation Elements */}
        <div className="co3E5A flex space-x-4">
          <div className="u5wAmW">
            <a href="/sign-in" className="text-gray-600 hover:text-gray-800">
              Sign In
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
