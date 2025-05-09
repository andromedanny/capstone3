// src/pages/LoginPage.jsx
import { useState } from 'react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here (e.g., call backend API)
    console.log('Email:', email, 'Password:', password);
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Log In</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg w-96"
      >
        <div className="mb-4">
          <label className="block text-lg font-medium" htmlFor="email">
            Email:
          </label>
          <input
            type="email"
            id="email"
            className="w-full p-3 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-medium" htmlFor="password">
            Password:
          </label>
          <input
            type="password"
            id="password"
            className="w-full p-3 border rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold"
        >
          Log In
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
