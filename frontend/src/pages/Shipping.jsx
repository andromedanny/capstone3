import React from 'react';

const Shipping = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-4">Shipping Setup</h1>
    <p className="text-gray-600 mb-4">Configure your shipping settings here.</p>
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Shipping Carrier</label>
        <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
          <option>FedEx</option>
          <option>UPS</option>
          <option>USPS</option>
          <option>DHL</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Shipping Rate</label>
        <input type="text" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" placeholder="Enter your shipping rate" />
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save Settings</button>
    </form>
  </div>
);

export default Shipping; 