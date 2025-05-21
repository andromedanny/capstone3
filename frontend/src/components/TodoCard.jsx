import React from 'react';
import { Link } from 'react-router-dom';

const TodoCard = ({ icon, title, description, subDescription, actionText, actionLink, variant = 'outline' }) => (
  <div className="todo-container bg-white rounded-lg shadow-md p-6 flex items-start">
    <div className="todo-icon mr-4">
      {icon}
    </div>
    <div className="todo-list flex-grow">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 mb-2">{description}</p>
      <p className="text-gray-600">{subDescription}</p>
    </div>
    <div className="todo-action ml-4">
      <Link 
        to={actionLink} 
        className={`inline-block px-4 py-2 rounded-md transition duration-200 ${
          variant === 'outline' 
            ? 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {actionText}
      </Link>
    </div>
  </div>
);

export default TodoCard; 