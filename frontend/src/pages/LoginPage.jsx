// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicHeader from '../components/PublicHeader';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Handle login logic here (e.g., call backend API)
      console.log('Email:', email, 'Password:', password);
      
      // TODO: Add your actual login API call here
      // const response = await axios.post('/api/login', { email, password });
      
      // For now, we'll simulate a successful login
      login();
      // After successful login, redirect to create-store page
      navigate('/create-store');
    } catch (error) {
      console.error('Login error:', error);
      // Handle login error (show error message, etc.)
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
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
            className="w-full py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition duration-200"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
