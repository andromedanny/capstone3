import React, { useState } from 'react';

const Payment = () => {
  const [activeTab, setActiveTab] = useState('gcash');
  const [gcashMobile, setGcashMobile] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [status, setStatus] = useState(null);

  // Placeholder for transaction history
  const transactionHistory = [
    // Example data
    // { id: 1, method: 'GCash', amount: 500, status: 'Success', date: '2024-06-01' },
  ];

  const handleGcashSubmit = (e) => {
    e.preventDefault();
    setStatus('GCash account setup saved.');
    // TODO: Integrate with backend
  };

  const handlePaypalSubmit = (e) => {
    e.preventDefault();
    setStatus('PayPal account setup saved.');
    // TODO: Integrate with backend
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Merchant Account Setup</h1>
      <p className="text-gray-600 mb-6">Set up your GCash and PayPal accounts to accept payments from buyers.</p>
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-t-md font-semibold focus:outline-none ${activeTab === 'gcash' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('gcash')}
        >
          GCash
        </button>
        <button
          className={`px-4 py-2 rounded-t-md font-semibold focus:outline-none ${activeTab === 'paypal' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('paypal')}
        >
          PayPal
        </button>
      </div>
      <div className="bg-white shadow rounded-b-md p-6 mb-8">
        {activeTab === 'gcash' && (
          <form onSubmit={handleGcashSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">GCash Mobile Number</label>
              <input
                type="text"
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={gcashMobile}
                onChange={e => setGcashMobile(e.target.value)}
                placeholder="Enter your GCash mobile number"
                required
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save GCash Account</button>
          </form>
        )}
        {activeTab === 'paypal' && (
          <form onSubmit={handlePaypalSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">PayPal Email</label>
              <input
                type="email"
                className="mt-1 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={paypalEmail}
                onChange={e => setPaypalEmail(e.target.value)}
                placeholder="Enter your PayPal email"
                required
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Save PayPal Account</button>
          </form>
        )}
      </div>
      {status && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-md">{status}</div>
      )}
      <div>
        <h2 className="text-xl font-semibold mb-2">Transaction History</h2>
        {transactionHistory.length === 0 ? (
          <p className="text-gray-500">No transactions yet.</p>
        ) : (
          <table className="min-w-full bg-white border rounded-md">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Method</th>
                <th className="py-2 px-4 border-b">Amount</th>
                <th className="py-2 px-4 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactionHistory.map(tx => (
                <tr key={tx.id}>
                  <td className="py-2 px-4 border-b">{tx.date}</td>
                  <td className="py-2 px-4 border-b">{tx.method}</td>
                  <td className="py-2 px-4 border-b">{tx.amount}</td>
                  <td className="py-2 px-4 border-b">{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Payment; 