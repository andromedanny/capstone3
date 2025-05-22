// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import axios from 'axios';
import TodoCard from '../components/TodoCard';

const Payment = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-4">Payment Setup</h1>
    <p className="text-gray-600 mb-4">Configure your payment settings here.</p>
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Gateway</label>
        <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
          <option>Stripe</option>
          <option>PayPal</option>
          <option>Square</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">API Key</label>
        <input type="text" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" placeholder="Enter your API key" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save Settings</button>
    </form>
  </div>
);

const Dashboard = () => {
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          setError('Please log in to view your store');
          setLoading(false);
          return;
        }

        console.log('Fetching store data...');
        const response = await axios.get('http://localhost:5000/api/stores', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Store data response:', response.data);
        if (response.data && response.data.length > 0) {
          console.log('Setting store name to:', response.data[0].storeName);
          setStoreName(response.data[0].storeName);
          setError(null);
        } else {
          console.log('No store data found');
          setStoreName('Your Store');
          setError('No store found. Please create a store first.');
        }
      } catch (error) {
        console.error('Error fetching store:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else {
          setError('Failed to fetch store information. Please try again.');
          setStoreName('Your Store');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, []);

  return (
    <div className="p-6">
      <div className="empty-state-container text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {loading ? 'Loading...' : `Welcome to ${storeName}`}
        </h1>
        {error && (
          <p className="text-red-600 mb-4">{error}</p>
        )}
        <p className="text-gray-600">Here are some tips to help you get started.</p>
      </div>

      <div className="grid gap-6">
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
          actionLink="/dashboard/settings"
          variant="outline"
        />
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
          actionLink="/dashboard/addproducts"
          variant="outline"
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
          actionLink="/dashboard/payment"
          variant="solid"
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
          actionLink="/dashboard/shipping"
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
      </div>
    </div>
  );
};

export default Dashboard;
  