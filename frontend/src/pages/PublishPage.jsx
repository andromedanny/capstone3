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
                        store.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {store.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Publish Status */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Publication Status</h3>
                {store.status === 'published' ? (
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

              {/* Social Media Sharing Section - Show when published */}
              {store && (
                <div className="mt-6">
                  {(() => {
                    const statusLower = (store.status || '').toLowerCase();
                    const isPublished = statusLower === 'published';
                    const websiteUrl = getWebsiteUrl();
                    
                    // Always show social sharing if published, otherwise show debug
                    if (isPublished && websiteUrl) {
                      return (
                        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-6 border-2 border-purple-400 shadow-lg">
                          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                              <polyline points="16 6 12 2 8 6"/>
                              <line x1="12" y1="2" x2="12" y2="15"/>
                            </svg>
                            🌐 Share Your Store on Social Media (Multi-Channel Selling)
                          </h3>
                          <p className="text-sm text-gray-800 mb-4 font-medium">
                            Share your store on Facebook, Twitter, WhatsApp, and more to reach more customers and increase sales!
                          </p>
                          <SocialShare 
                            url={websiteUrl}
                            title={store.storeName || 'Check out my store!'}
                            description={store.description || 'Visit my amazing online store'}
                          />
                        </div>
                      );
                    } else {
                      // Show debug info if not published or URL missing
                      return (
                        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                          <p className="text-sm font-semibold text-yellow-900 mb-2">🔍 Debug Information:</p>
                          <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                            <li>Store exists: {store ? 'Yes' : 'No'}</li>
                            <li>Status: "{store?.status}" (lowercase: "{statusLower}")</li>
                            <li>Is Published: {isPublished ? 'Yes' : 'No'}</li>
                            <li>Domain: "{store?.domainName || 'N/A'}"</li>
                            <li>Website URL: {websiteUrl || 'null'}</li>
                          </ul>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}

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
              <div className="flex space-x-4 flex-wrap gap-2">
                <button
                  onClick={() => navigate('/site-builder')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Edit Content
                </button>
                <button
                  onClick={() => {
                    // Check if store is published
                    const isPublished = store && store.status && (store.status.toLowerCase() === 'published');
                    const shareUrl = getWebsiteUrl();
                    
                    if (!isPublished || !shareUrl) {
                      alert('Please publish your store first before sharing!');
                      return;
                    }
                    
                    const shareTitle = store.storeName || 'Check out my store!';
                    
                    // Create a simple dropdown/modal
                    const modal = document.createElement('div');
                    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;';
                    modal.innerHTML = `
                      <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                        <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; color: #1f2937;">Share Your Store</h3>
                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                          <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}', 'facebook-share', 'width=626,height=436'); this.closest('[style*=\"position: fixed\"]').remove();" style="background: #1877F2; color: white; padding: 0.75rem 1rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            Share on Facebook
                          </button>
                          <button onclick="window.open('https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}', 'twitter-share', 'width=626,height=436'); this.closest('[style*=\"position: fixed\"]').remove();" style="background: #1DA1F2; color: white; padding: 0.75rem 1rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                            Share on Twitter
                          </button>
                          <button onclick="window.open('https://wa.me/?text=${encodeURIComponent(shareTitle + ' - ' + shareUrl)}', '_blank'); this.closest('[style*=\"position: fixed\"]').remove();" style="background: #25D366; color: white; padding: 0.75rem 1rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            Share on WhatsApp
                          </button>
                          <button onclick="navigator.clipboard.writeText('${shareUrl}'); alert('Link copied to clipboard!'); this.closest('[style*=\"position: fixed\"]').remove();" style="background: #6B7280; color: white; padding: 0.75rem 1rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                            Copy Link
                          </button>
                          <button onclick="this.closest('[style*=\"position: fixed\"]').remove();" style="background: #f3f4f6; color: #374151; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #d1d5db; font-weight: 600; cursor: pointer; margin-top: 0.5rem;">
                            Close
                          </button>
                        </div>
                      </div>
                    `;
                    document.body.appendChild(modal);
                    modal.addEventListener('click', (e) => {
                      if (e.target === modal) modal.remove();
                    });
                  }}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                    store && store.status && (store.status.toLowerCase() === 'published') && getWebsiteUrl()
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  disabled={!store || !store.status || (store.status.toLowerCase() !== 'published') || !getWebsiteUrl()}
                  title={store && store.status && (store.status.toLowerCase() === 'published') && getWebsiteUrl() ? 'Share your store on social media' : 'Publish your store first to share'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Share Store
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
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

