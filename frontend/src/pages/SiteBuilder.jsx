import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QuillEditor from '../components/QuillEditor';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';
import apiClient from '../utils/axios';
import { getImageUrl } from '../utils/imageUrl';
import '../styles/SiteBuilder.css';

// Template mapping
const templateFileMap = {
  bladesmith: 'struvaris.html',
  pottery: 'truvara.html',
  balisong: 'ructon.html',
  weavery: 'urastra.html',
  woodcarving: 'caturis.html'
};

const templateNames = {
  bladesmith: 'Struvaris',
  pottery: 'Truvara',
  balisong: 'Ructon',
  weavery: 'Urastra',
  woodcarving: 'Caturis'
};

export default function SiteBuilder() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const templateIdFromUrl = searchParams.get('template');
  
  const [templateId, setTemplateId] = useState(templateIdFromUrl || 'bladesmith');
  const [templateFile, setTemplateFile] = useState(templateFileMap[templateId] || 'struvaris.html');
  const [status, setStatus] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const iframeRef = useRef(null);
  const [storeId, setStoreId] = useState(null);
  
  // Store settings state
  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    description: '',
    domainName: '',
    region: '',
    province: '',
    municipality: '',
    barangay: '',
    contactEmail: '',
    phone: ''
  });
  
  // Location dropdowns state
  const [regionsList] = useState(regions);
  const [provincesList, setProvincesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);
  
  // Content state - these will be editable
  // Initialize with empty values - will be populated from store data or user input
  const [heroContent, setHeroContent] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Shop Now'
  });
  
  const [products, setProducts] = useState([
    { id: 1, name: '', price: '', description: '', image: '/imgplc.jpg' },
    { id: 2, name: '', price: '', description: '', image: '/imgplc.jpg' },
    { id: 3, name: '', price: '', description: '', image: '/imgplc.jpg' }
  ]);

  // Background settings state
  const [backgroundSettings, setBackgroundSettings] = useState({
    type: 'color', // 'color' or 'image'
    color: '#0a0a0a', // Default dark background
    image: '', // Base64 or URL
    repeat: 'no-repeat',
    size: 'cover',
    position: 'center'
  });

  useEffect(() => {
    if (templateIdFromUrl && templateFileMap[templateIdFromUrl]) {
      setTemplateId(templateIdFromUrl);
      setTemplateFile(templateFileMap[templateIdFromUrl]);
    }
  }, [templateIdFromUrl]);

  // Load existing store data
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await apiClient.get('/stores');

        if (response.data && response.data.length > 0) {
          const storeData = response.data[0];
          setStoreId(storeData.id);
          setStoreSettings({
            storeName: storeData.storeName || '',
            description: storeData.description || '',
            domainName: storeData.domainName || '',
            region: storeData.region || '',
            province: storeData.province || '',
            municipality: storeData.municipality || '',
            barangay: storeData.barangay || '',
            contactEmail: storeData.contactEmail || '',
            phone: storeData.phone || ''
          });

          // Load saved content if exists, otherwise use store form data
          if (storeData.content) {
            if (storeData.content.hero) {
              // Use saved hero content, but fallback to store data if empty
              const savedHero = storeData.content.hero;
              setHeroContent({
                title: savedHero.title && savedHero.title.trim() ? savedHero.title : (storeData.storeName || ''),
                subtitle: savedHero.subtitle && savedHero.subtitle.trim() ? savedHero.subtitle : (storeData.description ? `<p>${storeData.description}</p>` : ''),
                buttonText: savedHero.buttonText && savedHero.buttonText.trim() ? savedHero.buttonText : 'Shop Now'
              });
            } else {
              // No saved hero content, use store form data
              setHeroContent({
                title: storeData.storeName || '',
                subtitle: storeData.description ? `<p>${storeData.description}</p>` : '',
                buttonText: 'Shop Now'
              });
            }
            if (storeData.content.background) {
              setBackgroundSettings(storeData.content.background);
            }
          } else {
            // No saved content at all, initialize with store form data
            setHeroContent({
              title: storeData.storeName || '',
              subtitle: storeData.description ? `<p>${storeData.description}</p>` : '',
              buttonText: 'Shop Now'
            });
          }

          // Fetch products from API (products added via "Manage Products")
          try {
            const productsResponse = await apiClient.get('/products');

            if (productsResponse.data && productsResponse.data.length > 0) {
              // Convert API products to the format expected by SiteBuilder
              const apiProducts = productsResponse.data.map(product => ({
                id: product.id,
                name: product.name || '',
                price: product.price ? parseFloat(product.price).toString() : '',
                description: product.description || '',
                image: product.image || '/imgplc.jpg'
              }));

              // If there are saved products in content, merge them (API products take priority)
              if (storeData.content?.products && storeData.content.products.length > 0) {
                // Merge: use API products first, then add any content products that aren't in API
                const contentProductIds = new Set(apiProducts.map(p => p.id));
                const additionalContentProducts = storeData.content.products
                  .filter(p => !contentProductIds.has(p.id))
                  .map(p => ({
                    id: p.id,
                    name: p.name || '',
                    price: p.price ? parseFloat(p.price).toString() : '',
                    description: p.description || '',
                    image: p.image || '/imgplc.jpg'
                  }));
                
                setProducts([...apiProducts, ...additionalContentProducts]);
              } else {
                // No content products, just use API products
                setProducts(apiProducts);
              }
            } else {
              // No API products, check if there are content products
              if (storeData.content?.products && storeData.content.products.length > 0) {
                const contentProducts = storeData.content.products.map(product => ({
                  id: product.id,
                  name: product.name || '',
                  price: product.price ? parseFloat(product.price).toString() : '',
                  description: product.description || '',
                  image: product.image || '/imgplc.jpg'
                }));
                setProducts(contentProducts);
              }
              // If no products at all, keep the default empty products
            }
          } catch (error) {
            console.error('Error fetching products:', error);
            // If API fetch fails, try to use content products as fallback
            if (storeData.content?.products && storeData.content.products.length > 0) {
              const contentProducts = storeData.content.products.map(product => ({
                id: product.id,
                name: product.name || '',
                price: product.price ? parseFloat(product.price).toString() : '',
                description: product.description || '',
                image: product.image || '/imgplc.jpg'
              }));
              setProducts(contentProducts);
            }
          }

          // Load location dropdowns based on existing data
          if (storeData.region) {
            setProvincesList(getProvincesByRegion(storeData.region));
            if (storeData.province) {
              setMunicipalitiesList(getCityMunByProvince(storeData.province));
              if (storeData.municipality) {
                const barangaysData = getBarangayByMun(storeData.municipality);
                const barangaysArray = barangaysData?.data || barangaysData || [];
                setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
                  brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
                  name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
                })) : []);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
      }
    };

    fetchStoreData();
  }, []);

  // Load HTML template content
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await fetch(`/templates/${templateFile}`);
        const html = await response.text();
        setHtmlContent(html);
      } catch (error) {
        console.error('Error loading template:', error);
      }
    };
    loadTemplate();
  }, [templateFile]);

  // Update iframe with current content in real-time
  useEffect(() => {
    if (!htmlContent || !iframeRef.current) return;

    const updateIframe = () => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Update hero section
        const heroH1 = iframeDoc.querySelector('.hero h1');
        if (heroH1) {
          heroH1.textContent = heroContent.title;
        }

        // Update hero subtitle/paragraph
        const heroP = iframeDoc.querySelector('.hero .hero-content p');
        if (heroP) {
          // Remove wrapping <p> tags from Quill content if present
          const subtitleText = heroContent.subtitle.replace(/^<p>|<\/p>$/g, '').trim();
          heroP.innerHTML = subtitleText || '';
        }

        // Update button text
        const ctaButton = iframeDoc.querySelector('.hero .cta-button');
        if (ctaButton) {
          ctaButton.textContent = heroContent.buttonText;
        }

        // Apply background settings
        const body = iframeDoc.body;
        if (body) {
          if (backgroundSettings.type === 'color') {
            body.style.backgroundColor = backgroundSettings.color || '#0a0a0a';
            body.style.backgroundImage = 'none';
          } else if (backgroundSettings.type === 'image' && backgroundSettings.image) {
            body.style.backgroundImage = `url(${backgroundSettings.image})`;
            body.style.backgroundRepeat = backgroundSettings.repeat || 'no-repeat';
            body.style.backgroundSize = backgroundSettings.size || 'cover';
            body.style.backgroundPosition = backgroundSettings.position || 'center';
            body.style.backgroundColor = backgroundSettings.color || '#0a0a0a'; // Fallback color
          }
        }

        // Also apply to html element
        const html = iframeDoc.documentElement;
        if (html) {
          if (backgroundSettings.type === 'color') {
            html.style.backgroundColor = backgroundSettings.color || '#0a0a0a';
            html.style.backgroundImage = 'none';
          } else if (backgroundSettings.type === 'image' && backgroundSettings.image) {
            html.style.backgroundImage = `url(${backgroundSettings.image})`;
            html.style.backgroundRepeat = backgroundSettings.repeat || 'no-repeat';
            html.style.backgroundSize = backgroundSettings.size || 'cover';
            html.style.backgroundPosition = backgroundSettings.position || 'center';
            html.style.backgroundColor = backgroundSettings.color || '#0a0a0a';
          }
        }

        // Update products
        const productCards = iframeDoc.querySelectorAll('.product-card');
        products.forEach((product, index) => {
          if (productCards[index]) {
            const card = productCards[index];
            
            // Update product title
            const titleEl = card.querySelector('.product-title');
            if (titleEl) {
              titleEl.textContent = product.name;
            }

            // Update product price
            const priceEl = card.querySelector('.product-price');
            if (priceEl) {
              priceEl.textContent = `$${product.price}`;
            }

            // Update product description - preserve HTML from Quill
            const descEl = card.querySelector('.product-description');
            if (descEl) {
              // Remove wrapping <p> tags from Quill if present
              const descText = product.description.replace(/^<p>|<\/p>$/g, '').trim();
              descEl.innerHTML = descText || '';
            }

            // Update product image
            const imageEl = card.querySelector('.product-image');
            if (imageEl && product.image) {
              imageEl.src = product.image;
            }
          }
        });

        // If iframe hasn't loaded the content yet, write it first
        if (!iframeDoc.body || iframeDoc.body.children.length === 0) {
          iframeDoc.open();
          iframeDoc.write(htmlContent);
          iframeDoc.close();
          // Wait a bit then update
          setTimeout(updateIframe, 50);
        }
      } catch (error) {
        console.error('Error updating iframe:', error);
        // Fallback: try rewriting the HTML
        try {
          let updatedHtml = htmlContent;
          updatedHtml = updatedHtml.replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${heroContent.title}</h1>`);
          const subtitleText = heroContent.subtitle.replace(/^<p>|<\/p>$/g, '').trim();
          updatedHtml = updatedHtml.replace(/<p>[\s\S]*?<\/p>\s*<button/, `<p>${subtitleText}</p>\n            <button`);
          updatedHtml = updatedHtml.replace(/<button[^>]*class="cta-button"[^>]*>[\s\S]*?<\/button>/, `<button class="cta-button">${heroContent.buttonText}</button>`);
          
          const iframeDoc = iframe.contentDocument;
          iframeDoc.open();
          iframeDoc.write(updatedHtml);
          iframeDoc.close();
        } catch (fallbackError) {
          console.error('Fallback update also failed:', fallbackError);
        }
      }
    };

    // Small delay to ensure iframe is loaded
    const timer = setTimeout(updateIframe, 100);
    return () => clearTimeout(timer);
  }, [htmlContent, heroContent, products, backgroundSettings]);

  const handleHeroChange = (field, value) => {
    setHeroContent(prev => ({ ...prev, [field]: value }));
  };

  const handleProductChange = (id, field, value) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  };

  const handleAddProduct = () => {
    setProducts(prev => [...prev, {
      id: prev.length + 1,
      name: `Product ${prev.length + 1}`,
      price: '99.99',
      description: '<p>Lorem ipsum dolor sit amet</p>',
      image: '/imgplc.jpg'
    }]);
  };

  const handleDeleteProduct = (id) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const handleImageUpload = (productId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Convert to base64 for preview (or you can upload to server)
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, image: base64String }
          : product
      ));
    };
    reader.onerror = () => {
      alert('Error reading image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (productId) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, image: '/imgplc.jpg' }
        : product
    ));
  };

  const handleStoreSettingsChange = (field, value) => {
    // Handle location cascading dropdowns
    if (field === 'region') {
      setProvincesList(getProvincesByRegion(value));
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setStoreSettings(prev => ({ ...prev, [field]: value, province: '', municipality: '', barangay: '' }));
    } else if (field === 'province') {
      setMunicipalitiesList(getCityMunByProvince(value));
      setBarangaysList([]);
      setStoreSettings(prev => ({ ...prev, [field]: value, municipality: '', barangay: '' }));
    } else if (field === 'municipality') {
      const barangaysData = getBarangayByMun(value);
      const barangaysArray = barangaysData?.data || barangaysData || [];
      setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
        brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
        name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
      })) : []);
      setStoreSettings(prev => ({ ...prev, [field]: value, barangay: '' }));
    } else {
      setStoreSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSaveStoreSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus('Error: Please log in to save settings');
        return;
      }

      if (!storeId) {
        setStatus('Error: No store found. Please create a store first.');
        return;
      }

      const payload = {
        templateId,
        ...storeSettings
      };

      await apiClient.put(`/stores/${storeId}`, payload);

      setStatus('Store settings saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      setStatus('Error saving store settings: ' + (e.response?.data?.message || e.message));
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus('Error: Please log in to save');
        return;
      }

      if (!storeId) {
        setStatus('Error: No store found. Please create a store first.');
        return;
      }

      // Save store settings first
      await handleSaveStoreSettings();
      
      // Save template content (hero, products, background) to backend
      const content = {
        hero: heroContent,
        products: products,
        background: backgroundSettings
      };

      console.log('💾 Saving content with background settings:', backgroundSettings);
      console.log('💾 Full content object:', content);
      console.log('💾 Background type:', backgroundSettings.type);
      console.log('💾 Background image:', backgroundSettings.image);
      console.log('💾 Background color:', backgroundSettings.color);

      await apiClient.put(`/stores/${storeId}/content`, 
        { content },
      );

      setStatus('Content saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (e) {
      setStatus('Error saving: ' + (e.response?.data?.message || e.message));
      setTimeout(() => setStatus(''), 5000);
    }
  };

  // React Quill toolbar configuration for hero subtitle
  const heroSubtitleToolbar = [
    [{ 'header': [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ];

  // React Quill toolbar configuration for product descriptions
  const productDescriptionToolbar = [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ];

  return (
    <div className="site-builder-editor" style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex' }}>
      {/* Sidebar for editing */}
      <div className="editor-sidebar" style={{
        width: '400px',
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '2rem',
        overflowY: 'auto',
        maxHeight: '100vh'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {templateNames[templateId] || 'Template Editor'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Customize your store content
          </p>
        </div>

        {/* Store Settings Section */}
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
              Store Settings
            </h3>
            {storeId && (
              <button
                onClick={handleSaveStoreSettings}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Save
              </button>
            )}
          </div>
          
          {!storeId && (
            <p style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '1rem' }}>
              Create a store first to edit settings
            </p>
          )}

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Store Name
              </label>
              <input
                type="text"
                value={storeSettings.storeName}
                onChange={(e) => handleStoreSettingsChange('storeName', e.target.value)}
                disabled={!storeId}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: storeId ? 'white' : '#f3f4f6'
                }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                value={storeSettings.description}
                onChange={(e) => handleStoreSettingsChange('description', e.target.value)}
                disabled={!storeId}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                  background: storeId ? 'white' : '#f3f4f6'
                }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Domain Name
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="text"
                  value={storeSettings.domainName}
                  onChange={(e) => handleStoreSettingsChange('domainName', e.target.value)}
                  disabled={!storeId}
                  style={{
                    width: '70%',
                    padding: '0.375rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    background: storeId ? 'white' : '#f3f4f6'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>.structura.com</span>
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Region
              </label>
              <select
                value={storeSettings.region}
                onChange={(e) => handleStoreSettingsChange('region', e.target.value)}
                disabled={!storeId}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: storeId ? 'white' : '#f3f4f6'
                }}
              >
                <option value="">Select Region</option>
                {regionsList.map(region => (
                  <option key={region.reg_code} value={region.reg_code}>{region.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Province
              </label>
              <select
                value={storeSettings.province}
                onChange={(e) => handleStoreSettingsChange('province', e.target.value)}
                disabled={!storeId || !provincesList.length}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: (storeId && provincesList.length) ? 'white' : '#f3f4f6'
                }}
              >
                <option value="">Select Province</option>
                {provincesList.map(province => (
                  <option key={province.prov_code} value={province.prov_code}>{province.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Municipality/City
              </label>
              <select
                value={storeSettings.municipality}
                onChange={(e) => handleStoreSettingsChange('municipality', e.target.value)}
                disabled={!storeId || !municipalitiesList.length}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: (storeId && municipalitiesList.length) ? 'white' : '#f3f4f6'
                }}
              >
                <option value="">Select Municipality/City</option>
                {municipalitiesList.map(mun => (
                  <option key={mun.mun_code} value={mun.mun_code}>{mun.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Barangay
              </label>
              <select
                value={storeSettings.barangay}
                onChange={(e) => handleStoreSettingsChange('barangay', e.target.value)}
                disabled={!storeId || !barangaysList.length}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: (storeId && barangaysList.length) ? 'white' : '#f3f4f6'
                }}
              >
                <option value="">Select Barangay</option>
                {barangaysList.map((brgy, idx) => (
                  <option
                    key={brgy.brgy_code || brgy.code || brgy.brgyName || brgy.name || idx}
                    value={brgy.name}
                  >
                    {brgy.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Contact Email
              </label>
              <input
                type="email"
                value={storeSettings.contactEmail}
                onChange={(e) => handleStoreSettingsChange('contactEmail', e.target.value)}
                disabled={!storeId}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: storeId ? 'white' : '#f3f4f6'
                }}
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={storeSettings.phone}
                onChange={(e) => handleStoreSettingsChange('phone', e.target.value)}
                disabled={!storeId}
                style={{
                  width: '100%',
                  padding: '0.375rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  background: storeId ? 'white' : '#f3f4f6'
                }}
              />
            </div>
          </div>
        </div>

        {/* Hero Section Editor */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Hero Section
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Title
            </label>
            <input
              type="text"
              value={heroContent.title}
              onChange={(e) => handleHeroChange('title', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Subtitle
            </label>
            <QuillEditor
              value={heroContent.subtitle}
              onChange={(value) => handleHeroChange('subtitle', value)}
              toolbar={heroSubtitleToolbar}
              style={{
                background: 'white',
                borderRadius: '0.375rem'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Button Text
            </label>
            <input
              type="text"
              value={heroContent.buttonText}
              onChange={(e) => handleHeroChange('buttonText', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>

        {/* Background Customization */}
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
            Background Settings
          </h3>
          
          {/* Background Type Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Background Type
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setBackgroundSettings(prev => ({ ...prev, type: 'color' }))}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: `2px solid ${backgroundSettings.type === 'color' ? '#8b5cf6' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  background: backgroundSettings.type === 'color' ? '#ede9fe' : 'white',
                  color: backgroundSettings.type === 'color' ? '#8b5cf6' : '#374151',
                  cursor: 'pointer',
                  fontWeight: backgroundSettings.type === 'color' ? '600' : '400'
                }}
              >
                Color
              </button>
              <button
                onClick={() => setBackgroundSettings(prev => ({ ...prev, type: 'image' }))}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: `2px solid ${backgroundSettings.type === 'image' ? '#8b5cf6' : '#d1d5db'}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  background: backgroundSettings.type === 'image' ? '#ede9fe' : 'white',
                  color: backgroundSettings.type === 'image' ? '#8b5cf6' : '#374151',
                  cursor: 'pointer',
                  fontWeight: backgroundSettings.type === 'image' ? '600' : '400'
                }}
              >
                Image
              </button>
            </div>
          </div>

          {/* Color Background Options */}
          {backgroundSettings.type === 'color' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                Background Color
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={backgroundSettings.color || '#0a0a0a'}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    console.log('🎨 Color background changed to:', newColor);
                    setBackgroundSettings(prev => {
                      const updated = { ...prev, color: newColor, type: 'color' };
                      console.log('🎨 Updated background settings:', updated);
                      return updated;
                    });
                  }}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={backgroundSettings.color || '#0a0a0a'}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    console.log('🎨 Color background text changed to:', newColor);
                    setBackgroundSettings(prev => {
                      const updated = { ...prev, color: newColor, type: 'color' };
                      console.log('🎨 Updated background settings:', updated);
                      return updated;
                    });
                  }}
                  placeholder="#0a0a0a"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
          )}

          {/* Image Background Options */}
          {backgroundSettings.type === 'image' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Background Image
                </label>
                <div style={{
                  width: '100%',
                  height: '120px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '0.375rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  background: '#fff',
                  position: 'relative'
                }}>
                  {backgroundSettings.image ? (
                    <>
                      <img
                        src={backgroundSettings.image.startsWith('http') 
                          ? backgroundSettings.image 
                          : getImageUrl(backgroundSettings.image)}
                        alt="Background preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.error('Failed to load background image:', backgroundSettings.image);
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        onClick={() => setBackgroundSettings(prev => ({ ...prev, image: '' }))}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No image selected</span>
                  )}
                </div>
                <label
                  htmlFor="background-image-upload"
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: '#fff',
                    color: '#374151',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = '#fff'}
                >
                  {backgroundSettings.image ? 'Change Image' : 'Upload Image'}
                </label>
                <input
                  id="background-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (!file.type.startsWith('image/')) {
                        alert('Please select an image file');
                        return;
                      }
                      const maxSize = 5 * 1024 * 1024; // 5MB
                      if (file.size > maxSize) {
                        alert('Image size must be less than 5MB');
                        return;
                      }
                      
                      try {
                        // Upload image to server
                        const token = localStorage.getItem('token');
                        if (!token) {
                          alert('Please log in to upload images');
                          return;
                        }
                        
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        const response = await apiClient.post('/stores/background/upload', formData, {
                          headers: {
                            'Content-Type': 'multipart/form-data'
                          }
                        });
                        
                        // Save just the relative path (not full URL) for portability
                        // The full URL will be constructed when displaying
                        const newImageUrl = response.data.imageUrl;
                        console.log('📸 Background image uploaded, URL:', newImageUrl);
                        setBackgroundSettings(prev => {
                          const updated = { ...prev, image: newImageUrl, type: 'image' };
                          console.log('📸 Updated background settings:', updated);
                          return updated;
                        });
                        setStatus('Background image uploaded successfully!');
                        setTimeout(() => setStatus(''), 3000);
                      } catch (error) {
                        console.error('Error uploading background image:', error);
                        alert('Failed to upload image. Please try again.');
                      }
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <p style={{ marginTop: '0.25rem', fontSize: '0.65rem', color: '#6b7280' }}>
                  JPG, PNG, or GIF (max 5MB). You can also paste an image URL.
                </p>
                <input
                  type="text"
                  placeholder="Or enter image URL (e.g., https://example.com/image.jpg)"
                  value={backgroundSettings.image 
                    ? (backgroundSettings.image.startsWith('http') 
                        ? backgroundSettings.image 
                        : getImageUrl(backgroundSettings.image))
                    : ''}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value) {
                      // If it's a full URL, save it as-is; if it's a relative path, save just the path
                      if (value.startsWith('http')) {
                        setBackgroundSettings(prev => ({ ...prev, image: value, type: 'image' }));
                      } else if (value.startsWith('/')) {
                        setBackgroundSettings(prev => ({ ...prev, image: value, type: 'image' }));
                      } else {
                        // Assume it's a full URL if it doesn't start with /
                        setBackgroundSettings(prev => ({ ...prev, image: value, type: 'image' }));
                      }
                    } else {
                      // Allow clearing the field
                      setBackgroundSettings(prev => ({ ...prev, image: '' }));
                    }
                  }}
                  onBlur={(e) => {
                    // When user finishes typing, ensure type is set to 'image' if there's a value
                    if (e.target.value.trim()) {
                      setBackgroundSettings(prev => ({ ...prev, type: 'image' }));
                    }
                  }}
                  style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              {/* Image Settings */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Background Size
                </label>
                <select
                  value={backgroundSettings.size || 'cover'}
                  onChange={(e) => setBackgroundSettings(prev => ({ ...prev, size: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="auto">Auto</option>
                  <option value="100% 100%">Stretch</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Background Position
                </label>
                <select
                  value={backgroundSettings.position || 'center'}
                  onChange={(e) => setBackgroundSettings(prev => ({ ...prev, position: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top left">Top Left</option>
                  <option value="top right">Top Right</option>
                  <option value="bottom left">Bottom Left</option>
                  <option value="bottom right">Bottom Right</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                  Fallback Color (if image fails to load)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={backgroundSettings.color || '#0a0a0a'}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      console.log('🎨 Fallback color changed to:', newColor);
                      setBackgroundSettings(prev => {
                        const updated = { ...prev, color: newColor };
                        console.log('🎨 Updated background settings:', updated);
                        return updated;
                      });
                    }}
                    style={{
                      width: '60px',
                      height: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={backgroundSettings.color || '#0a0a0a'}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      console.log('🎨 Fallback color text changed to:', newColor);
                      setBackgroundSettings(prev => {
                        const updated = { ...prev, color: newColor };
                        console.log('🎨 Updated background settings:', updated);
                        return updated;
                      });
                    }}
                    placeholder="#0a0a0a"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Products Editor */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
              Products
            </h3>
            <button
              onClick={handleAddProduct}
              style={{
                padding: '0.5rem 1rem',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              + Add
            </button>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {products.map((product) => (
              <div key={product.id} style={{
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                marginBottom: '1rem',
                background: '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>Product {product.id}</span>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem' }}>Name</label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.375rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem' }}>Price</label>
                  <input
                    type="text"
                    value={product.price}
                    onChange={(e) => handleProductChange(product.id, 'price', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.375rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem' }}>Image</label>
                  <div style={{ 
                    width: '100%', 
                    height: '100px', 
                    border: '1px dashed #d1d5db',
                    borderRadius: '0.25rem',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: '#f9fafb',
                    position: 'relative'
                  }}>
                    {product.image && product.image !== '/imgplc.jpg' && (
                      <>
                        <img 
                          src={product.image} 
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <button
                          onClick={() => handleRemoveImage(product.id)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            zIndex: 10
                          }}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </>
                    )}
                    {(!product.image || product.image === '/imgplc.jpg') && (
                      <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No image selected</span>
                    )}
                  </div>
                  <label
                    htmlFor={`image-upload-${product.id}`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.375rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: '#fff',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.target.style.background = '#fff'}
                  >
                    {product.image && product.image !== '/imgplc.jpg' ? 'Change Image' : 'Upload Image'}
                  </label>
                  <input
                    id={`image-upload-${product.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(product.id, e)}
                    style={{
                      display: 'none'
                    }}
                  />
                  <p style={{ 
                    marginTop: '0.25rem', 
                    fontSize: '0.65rem', 
                    color: '#6b7280' 
                  }}>
                    JPG, PNG, or GIF (max 5MB)
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem' }}>Description</label>
                  <QuillEditor
                    value={product.description}
                    onChange={(value) => handleProductChange(product.id, 'description', value)}
                    toolbar={productDescriptionToolbar}
                    style={{
                      background: 'white',
                      borderRadius: '0.25rem',
                      marginBottom: '0.5rem'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div>
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(45deg, #8B5CF6, #4C1D95)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            Save Changes
          </button>
          {status && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: status.includes('Error') ? '#fee2e2' : '#d1fae5',
              color: status.includes('Error') ? '#dc2626' : '#065f46',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              {status}
            </div>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="editor-preview" style={{ flex: 1, background: '#f3f4f6', padding: '2rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          height: 'calc(100vh - 4rem)'
        }}>
          <iframe
            ref={iframeRef}
            src={`/templates/${templateFile}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="Template Preview"
            onLoad={() => {
              // Trigger update when iframe loads
              if (iframeRef.current && htmlContent) {
                const event = new Event('updatePreview');
                window.dispatchEvent(event);
              }
            }}
          />
        </div>
        </div>
    </div>
  );
} 