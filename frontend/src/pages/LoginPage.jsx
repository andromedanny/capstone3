// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicHeader from '../components/PublicHeader';
import axios from 'axios';
import { FaUserCircle } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check for success message from registration
  useState(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      if (response.data.token) {
        // Store the token in localStorage
        localStorage.setItem('token', response.data.token);
        
        // Update auth context with user data
        login(response.data.user);
        
        // Redirect to store templates page
        navigate('/store-templates');
      } else {
        setError('No token received from server');
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'An error occurred during login. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #7f53ac 0%, #647dee 100%)' }}>
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', width: '900px', height: '500px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
          {/* Left Panel */}
          <div style={{ background: '#181c2f', color: '#fff', width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
            <FaUserCircle size={64} style={{ marginBottom: 32, color: '#7f53ac' }} />
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div style={{ marginBottom: 24 }}>
                <input
                  type="email"
                  placeholder="Username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', marginBottom: 16, fontSize: 16 }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: '#23264a', color: '#fff', fontSize: 16 }}
                />
              </div>
              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'linear-gradient(90deg, #ff267a 0%, #7f53ac 100%)', color: '#fff', fontWeight: 'bold', fontSize: 16, border: 'none', marginBottom: 16, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Signing in...' : 'LOGIN'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#aaa' }}>
                <span>
                  <input type="checkbox" id="remember-me" style={{ marginRight: 6 }} /> Remember me
                </span>
                <a href="#" style={{ color: '#7f53ac', textDecoration: 'none' }}>Forgot password?</a>
              </div>
            </form>
            <div style={{ marginTop: 24, fontSize: 14, color: '#aaa' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#7f53ac', fontWeight: 'bold', textDecoration: 'none' }}>Sign up</Link>
            </div>
            {error && <div style={{ color: '#ff267a', marginTop: 16 }}>{error}</div>}
            {success && <div style={{ color: '#4ade80', marginTop: 16 }}>{success}</div>}
          </div>
          {/* Right Panel */}
          <div style={{ background: 'rgba(24,28,47,0.95)', color: '#fff', width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ fontSize: 40, fontWeight: 'bold', marginBottom: 16 }}>Welcome.</div>
            <div style={{ fontSize: 18, color: '#aaa', textAlign: 'center', maxWidth: 320 }}>Sign in to access your dashboard and manage your store with ease.</div>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, background: 'radial-gradient(circle at 60% 40%, #7f53ac55 0%, transparent 70%)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
