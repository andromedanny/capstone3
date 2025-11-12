import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import SocialShare from '../components/SocialShare';

const PublishPage = () => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await apiClient.get('/stores');

        if (response.data && response.data.length > 0) {
          setStore(response.data[0]);
        } else {
          setError('No store found. Please create a store first.');
        }
      } catch (error) {
        console.error('Error fetching store:', error);
        setError('Failed to fetch store information.');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [navigate]);

  // Debug: Log store status
  useEffect(() => {
    if (store) {
      console.log('🔍 Store status debug:', {
        status: store.status,
        statusType: typeof store.status,
        statusLower: store.status?.toLowerCase(),
        isPublished: store.status?.toLowerCase() === 'published',
        domainName: store.domainName
      });
    }
  }, [store]);

  const handlePublish = async (status) => {
    if (!store) return;

    setPublishing(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.put(
        `/stores/${store.id}/publish`,
        { status }
      );

      setStore(response.data.store);
      setSuccess(
        status === 'published'
          ? 'Your website has been published successfully!'
          : 'Your website has been unpublished.'
      );
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(
        error.response?.data?.message || 'Failed to publish/unpublish website.'
      );
      setTimeout(() => setError(''), 5000);
    } finally {
      setPublishing(false);
    }
  };

  const getWebsiteUrl = () => {
    if (!store) {
      console.log('🔍 getWebsiteUrl: no store');
      return null;
    }
    // Check for both lowercase and capitalized status
    const isPublished = store.status === 'published' || store.status === 'Published';
    if (!isPublished) {
      console.log('🔍 getWebsiteUrl: not published', { status: store?.status });
      return null;
    }
    if (!store.domainName) {
      console.log('🔍 getWebsiteUrl: no domainName');
      return null;
    }
    // URL encode the domain name to handle spaces and special characters
    const encodedDomain = encodeURIComponent(store.domainName);
    // Use current window location to get the correct port
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/published/${encodedDomain}`;
    console.log('🔍 getWebsiteUrl: returning', url);
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-2">Publish Your Website</h1>
          <p className="text-gray-600 mb-8">
            Make your website live or take it offline
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {store && (
            <div className="space-y-6">
              {/* Store Information */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-semibold mb-4">Store Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Store Name</p>
                    <p className="font-medium">{store.storeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Domain</p>
                    <p className="font-medium">{store.domainName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Access at: {window.location.origin}/published/{store.domainName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        store.status && store.status.toLowerCase() === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {store.status && store.status.toLowerCase() === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Publish Status */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Publication Status</h3>
                {(store.status && store.status.toLowerCase() === 'published') ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-green-700">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="font-medium">Your website is live!</span>
                    </div>
                    {getWebsiteUrl() && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Your website URL (share this with customers):</p>
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-3">
                          <a
                            href={getWebsiteUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 font-medium break-all flex-1"
                          >
                            {getWebsiteUrl()}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(getWebsiteUrl());
                              setSuccess('URL copied to clipboard!');
                              setTimeout(() => setSuccess('Your website has been published successfully!'), 2000);
                            }}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm font-medium"
                            title="Copy URL"
                          >
                            📋 Copy
                          </button>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2 mb-4">
                          💡 <strong>Tip:</strong> This URL is free and works immediately. Customers can visit and buy products right away!
                        </p>
                      </div>
                    )}
                    
                    {/* Social Media Sharing Section - Always show when published and URL exists */}
                    {getWebsiteUrl() && (
                      <div 
                        style={{ 
                          padding: '1.5rem',
                          backgroundColor: '#f3e8ff',
                          background: 'linear-gradient(to right, #f3e8ff, #dbeafe)',
                          borderRadius: '0.5rem',
                          border: '2px solid #a855f7',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          marginTop: '1.5rem',
                          marginBottom: '1.5rem',
                          width: '100%',
                          minHeight: '200px',
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        <h3 style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: 'bold', 
                          color: '#1f2937', 
                          marginBottom: '0.75rem',
                          display: 'block'
                        }}>
                          🌐 Share Your Store on Social Media
                        </h3>
                        <p style={{ 
                          fontSize: '0.875rem', 
                          color: '#1f2937', 
                          marginBottom: '1rem',
                          fontWeight: '500',
                          display: 'block'
                        }}>
                          Share your store on Facebook, Twitter, WhatsApp, and more to reach more customers and increase sales!
                        </p>
                        <div style={{ width: '100%', display: 'block' }}>
                          <SocialShare 
                            url={getWebsiteUrl()}
                            title={store.storeName || 'Check out my store!'}
                            description={store.description || 'Visit my amazing online store'}
                          />
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handlePublish('draft')}
                      disabled={publishing}
                      className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {publishing ? 'Unpublishing...' : 'Unpublish Website'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <span className="font-medium">Your website is not published</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Click the button below to make your website live and accessible to visitors.
                    </p>
                    <button
                      onClick={() => handlePublish('published')}
                      disabled={publishing}
                      className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {publishing ? 'Publishing...' : 'Publish Website'}
                    </button>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2 text-blue-900">
                  How to Publish & Share Your Store
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li>Make sure you've saved all your content in the Site Builder</li>
                  <li>Review your store settings and information</li>
                  <li>Click "Publish Website" to make your site live</li>
                  <li>Copy and share your website URL with customers - it's free and works immediately!</li>
                </ol>
                <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                  <p className="text-xs text-blue-900 font-semibold mb-1">💡 Want a Custom Domain?</p>
                  <p className="text-xs text-blue-700">
                    You can add your own custom domain (like mystore.com) to Vercel for free if you own a domain. 
                    See <code className="bg-blue-100 px-1 rounded">CUSTOM_DOMAIN_SETUP.md</code> in the project for instructions.
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
                <div className="flex space-x-4 flex-wrap gap-2">
                  <button
                    onClick={() => navigate('/site-builder')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                  >
                    Edit Content
                  </button>
                  
                  
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {!store && error && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => navigate('/store-templates')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create a Store
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublishPage;

