// src/components/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-100 p-4 fixed top-16 left-0 h-full overflow-y-auto">
      <ul className="space-y-4">
        <li className="mt-4">
          <Link to="/dashboard" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            🏠 Dashboard
          </Link>
        </li>
        <li>
          <Link to="/orders" className="text-gray-700 hover:text-gray-900 transition-colors">
            📦 Orders
          </Link>
        </li>
        <li>
          <Link to="/products" className="text-gray-700 hover:text-gray-900 transition-colors">
            🛠️ Products
          </Link>
        </li>
        <li>
          <Link to="/categories" className="text-gray-700 hover:text-gray-900 transition-colors">
            📂 Categories
          </Link>
        </li>
        <li>
          <Link to="/collections" className="text-gray-700 hover:text-gray-900 transition-colors">
            🧺 Collections
          </Link>
        </li>
        <li>
          <Link to="/settings" className="text-gray-700 hover:text-gray-900 transition-colors">
            ⚙️ Settings
          </Link>
        </li>
        <li>
          <Link to="/reports" className="text-gray-700 hover:text-gray-900 transition-colors">
            📊 Reports
          </Link>
        </li>
        <li>
          <Link to="/site-builder" className="text-gray-700 hover:text-gray-900 transition-colors">
            🧱 Site Builder
          </Link>
        </li>
        <li>
          <Link to="/site-settings" className="text-gray-700 hover:text-gray-900 transition-colors">
            🔧 Site Settings
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
