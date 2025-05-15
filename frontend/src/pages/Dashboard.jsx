// src/pages/Dashboard.jsx
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

const Dashboard = () => {
  return (
    <div className="p-6">
      <div className="empty-state-container text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Your Store</h1>
        <p className="text-gray-600">Here are some tips to help you get started.</p>
      </div>

      <div className="grid gap-6">
        <TodoCard
          icon={
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          }
          title="Add Products"
          description="Let's roll your products out!"
          subDescription="Showcase your products with great descriptions. The more detailed you are, the better."
          actionText="Add More Products"
          actionLink="/products/add"
          variant="outline"
        />

        <TodoCard
          icon={
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          }
          title="Publish"
          description="Register. Set. Publish."
          subDescription="Our easy-to-follow guide will walk you through every step from domain mapping to publishing."
          actionText="Publish Site"
          actionLink="/publish"
          variant="solid"
        />

        <TodoCard
          icon={
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          }
          title="Taxes"
          description="Taxes can be taxing!"
          subDescription="Configure your store-wide taxes."
          actionText="Set Tax"
          actionLink="/taxes"
          variant="solid"
        />

        <TodoCard
          icon={
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          }
          title="Payment"
          description="Help the money roll in!"
          subDescription="Integrate with the best payment gateways to collect payments online."
          actionText="Set Up Payment"
          actionLink="/payment"
          variant="solid"
        />

        <TodoCard
          icon={
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          }
          title="Store Information"
          description="Let's add some details."
          subDescription="Fill in your store's basic information to get started."
          actionText="Edit Organization Profile"
          actionLink="/settings"
          variant="outline"
        />

        <TodoCard
          icon={
            <div className="bg-indigo-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          }
          title="Shipping"
          description="Take your products places."
          subDescription="Configure your rates and delivery times according to your location and shipping carriers."
          actionText="Configure Shipping"
          actionLink="/shipping"
          variant="outline"
        />
      </div>
    </div>
  );
};

export default Dashboard;
