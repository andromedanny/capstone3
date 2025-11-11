import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../utils/axios';
import { getImageUrl } from '../utils/imageUrl';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';

// Template mapping
const templateFileMap = {
  bladesmith: 'struvaris.html',
  pottery: 'truvara.html',
  balisong: 'ructon.html',
  weavery: 'urastra.html',
  woodcarving: 'caturis.html'
};

const PublishedStore = () => {
  const { domain } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const iframeRef = React.useRef(null);
  
  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderData, setOrderData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    quantity: 1,
    paymentMethod: 'gcash',
    region: '',
    province: '',
    municipality: '',
    barangay: '',
    shipping: 0
  });
  const [regionsList] = useState(regions);
  const [provincesList, setProvincesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        // URL encode the domain to handle spaces and special characters
        const encodedDomain = encodeURIComponent(domain);
        const response = await apiClient.get(
          `/stores/public/${encodedDomain}`
        );

        setStore(response.data);
        
        console.log('📦 Store loaded:', response.data);
        console.log('📦 Store content:', response.data.content);
        console.log('📦 Background settings:', response.data.content?.background);
        
        // Fetch products from the Products API for this store
        try {
          const productsResponse = await apiClient.get(
            `/products/public/${response.data.id}`
          );
          setProducts(productsResponse.data || []);
        } catch (productsError) {
          console.error('Error fetching products:', productsError);
          // If products API fails, use products from store.content as fallback
          setProducts(response.data.content?.products || []);
        }
        
        // Load the template file
        const templateFile = templateFileMap[response.data.templateId] || 'struvaris.html';
        try {
          const templateResponse = await fetch(`/templates/${templateFile}`);
          if (!templateResponse.ok) {
            throw new Error(`Template file not found: ${templateFile}`);
          }
          const html = await templateResponse.text();
          setHtmlContent(html);
        } catch (templateError) {
          console.error('Error loading template:', templateError);
          setError(`Template file not found: ${templateFile}. Please check if the template exists.`);
        }
      } catch (error) {
        console.error('Error fetching published store:', error);
        console.error('Error details:', error.response?.data);
        
        if (error.response?.status === 404) {
          setError('Store not found or not published. Make sure the store is published and the domain name is correct.');
        } else if (error.response?.status === 403) {
          setError('Access denied. This store may not be published yet.');
        } else {
          setError(`Error loading store: ${error.response?.data?.message || error.message}`);
        }
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (domain) {
      fetchStore();
    } else {
      setError('No domain specified in URL');
      setLoading(false);
    }
  }, [domain]);

  // Update iframe with store content
  useEffect(() => {
    if (!store || !htmlContent || !iframeRef.current) return;
    
    // Use products from API if available, otherwise fallback to store.content.products
    const displayProducts = products.length > 0 ? products : (store.content?.products || []);

    const updateIframe = () => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentDocument) return;

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Write the HTML content first if not already written
        if (!iframeDoc.body || iframeDoc.body.children.length === 0) {
          iframeDoc.open();
          iframeDoc.write(htmlContent);
          iframeDoc.close();
          // Wait a bit then update
          setTimeout(updateIframe, 100);
          return;
        }

        // Apply background settings
        const backgroundSettings = store.content?.background || { type: 'color', color: '#0a0a0a' };
        console.log('🎨 Applying background settings:', backgroundSettings);
        console.log('🎨 Store content:', store.content);
        console.log('🎨 Background type:', backgroundSettings.type);
        console.log('🎨 Background image:', backgroundSettings.image);
        console.log('🎨 Background color:', backgroundSettings.color);
        
        const body = iframeDoc.body;
        if (body) {
          if (backgroundSettings.type === 'color') {
            body.style.setProperty('background-color', backgroundSettings.color || '#0a0a0a', 'important');
            body.style.setProperty('background-image', 'none', 'important');
            console.log('✅ Applied color background:', backgroundSettings.color);
          } else if (backgroundSettings.type === 'image' && backgroundSettings.image) {
            // Handle both full URLs and relative paths
            let imageUrl = backgroundSettings.image;
            console.log('🖼️ Original image URL:', imageUrl);
            
            // If it's already a full URL, use it; otherwise get full URL
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
              imageUrl = getImageUrl(imageUrl) || imageUrl;
            }
            
            console.log('🖼️ Final image URL:', imageUrl);
            // Use setProperty with important flag to override any template styles
            body.style.setProperty('background-image', `url("${imageUrl}")`, 'important');
            body.style.setProperty('background-repeat', backgroundSettings.repeat || 'no-repeat', 'important');
            body.style.setProperty('background-size', backgroundSettings.size || 'cover', 'important');
            body.style.setProperty('background-position', backgroundSettings.position || 'center', 'important');
            body.style.setProperty('background-color', backgroundSettings.color || '#0a0a0a', 'important');
            body.style.setProperty('background-attachment', 'fixed', 'important');
            
            console.log('✅ Applied image background to body');
            // Verify the style was applied
            const appliedBg = body.style.getPropertyValue('background-image');
            console.log('✅ Body background-image style:', appliedBg);
          } else {
            console.warn('⚠️ No background image found, using default color');
            body.style.setProperty('background-color', backgroundSettings.color || '#0a0a0a', 'important');
            body.style.setProperty('background-image', 'none', 'important');
          }
        }

        // Also apply to html element
        const html = iframeDoc.documentElement;
        if (html) {
          if (backgroundSettings.type === 'color') {
            html.style.backgroundColor = backgroundSettings.color || '#0a0a0a';
            html.style.backgroundImage = 'none';
          } else if (backgroundSettings.type === 'image' && backgroundSettings.image) {
            // Handle both full URLs and relative paths
            let imageUrl = backgroundSettings.image;
            if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
              imageUrl = getImageUrl(imageUrl) || imageUrl;
            }
            html.style.setProperty('background-image', `url("${imageUrl}")`, 'important');
            html.style.setProperty('background-repeat', backgroundSettings.repeat || 'no-repeat', 'important');
            html.style.setProperty('background-size', backgroundSettings.size || 'cover', 'important');
            html.style.setProperty('background-position', backgroundSettings.position || 'center', 'important');
            html.style.setProperty('background-color', backgroundSettings.color || '#0a0a0a', 'important');
            html.style.setProperty('background-attachment', 'fixed', 'important');
            
            console.log('✅ Applied image background to html');
          }
        }
        
        // Remove default template background images (like the sunglasses in hero::before)
        // We need to inject CSS to override the ::before pseudo-element
        let overrideStyle = iframeDoc.getElementById('background-override-style');
        if (!overrideStyle) {
          overrideStyle = iframeDoc.createElement('style');
          overrideStyle.id = 'background-override-style';
          iframeDoc.head.appendChild(overrideStyle);
        }
        
        // Aggressively remove ALL default background images from hero section
        overrideStyle.textContent = `
          /* Remove hero::before pseudo-element completely */
          .hero::before {
            background-image: none !important;
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            content: none !important;
            position: absolute !important;
            width: 0 !important;
            height: 0 !important;
          }
          
          /* Remove hero::after as well */
          .hero::after {
            background-image: none !important;
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            content: none !important;
          }
          
          /* Remove any default hero background */
          .hero {
            background-image: none !important;
          }
          
          /* Remove background from any hero children */
          .hero > * {
            background-image: none !important;
          }
          
          /* Remove background from body if it has a default image */
          body {
            background-image: none !important;
          }
        `;
        
        // If we have a custom background, ensure it's applied
        if (backgroundSettings.type === 'image' && backgroundSettings.image) {
          overrideStyle.textContent += `
            /* Ensure custom background is visible */
            body, html {
              background-image: url("${backgroundSettings.image.startsWith('http') ? backgroundSettings.image : getImageUrl(backgroundSettings.image) || backgroundSettings.image}") !important;
              background-repeat: ${backgroundSettings.repeat || 'no-repeat'} !important;
              background-size: ${backgroundSettings.size || 'cover'} !important;
              background-position: ${backgroundSettings.position || 'center'} !important;
              background-attachment: fixed !important;
            }
          `;
        }
        
        // Apply custom background to hero section if it exists
        const heroSection = iframeDoc.querySelector('.hero');
        if (heroSection && backgroundSettings.type === 'image' && backgroundSettings.image) {
          let imageUrl = backgroundSettings.image;
          if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            imageUrl = getImageUrl(imageUrl) || imageUrl;
          }
          heroSection.style.setProperty('background-image', `url("${imageUrl}")`, 'important');
          heroSection.style.setProperty('background-repeat', backgroundSettings.repeat || 'no-repeat', 'important');
          heroSection.style.setProperty('background-size', backgroundSettings.size || 'cover', 'important');
          heroSection.style.setProperty('background-position', backgroundSettings.position || 'center', 'important');
          console.log('✅ Applied image background to hero section');
        }
        
        // Also try applying to the main container/wrapper if it exists
        const mainContainer = iframeDoc.querySelector('main, .main, .container, .wrapper, #app');
        if (mainContainer && backgroundSettings.type === 'image' && backgroundSettings.image) {
          let imageUrl = backgroundSettings.image;
          if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            imageUrl = getImageUrl(imageUrl) || imageUrl;
          }
          mainContainer.style.setProperty('background-image', `url("${imageUrl}")`, 'important');
          mainContainer.style.setProperty('background-repeat', backgroundSettings.repeat || 'no-repeat', 'important');
          mainContainer.style.setProperty('background-size', backgroundSettings.size || 'cover', 'important');
          mainContainer.style.setProperty('background-position', backgroundSettings.position || 'center', 'important');
          console.log('✅ Applied image background to main container');
        }

        // Update hero section - prioritize store form data over content
        const heroContent = store.content?.hero || {};
        
        // Use store name from form if hero title is empty or not set
        const heroTitle = (heroContent.title && heroContent.title.trim()) 
          ? heroContent.title.trim() 
          : (store.storeName || 'Store');
        
        const heroH1 = iframeDoc.querySelector('.hero h1, h1.hero-title');
        if (heroH1) {
          heroH1.textContent = heroTitle;
        }

        // Use store description from form if hero subtitle is empty or not set
        const heroP = iframeDoc.querySelector('.hero .hero-content p, .hero p, .hero-subtitle');
        if (heroP) {
          let subtitleText = '';
          if (heroContent.subtitle && heroContent.subtitle.trim()) {
            subtitleText = heroContent.subtitle.replace(/^<p>|<\/p>$/g, '').trim();
          }
          
          // If no subtitle in content, use store description from form
          if (!subtitleText && store.description && store.description.trim()) {
            subtitleText = store.description.trim();
          }
          
          if (subtitleText) {
            // Check if it contains HTML tags
            if (subtitleText.includes('<')) {
              heroP.innerHTML = subtitleText;
            } else {
              heroP.textContent = subtitleText;
            }
          }
        }

        // Update CTA button - try multiple selectors
        const ctaButtonSelectors = [
          '.hero .cta-button',
          '.cta-button',
          '.hero button',
          'button.cta-button',
          '.hero-content button',
          '.hero button.cta-button'
        ];
        
        let ctaButton = null;
        for (const selector of ctaButtonSelectors) {
          ctaButton = iframeDoc.querySelector(selector);
          if (ctaButton) break;
        }
        
        if (ctaButton) {
          const buttonText = heroContent.buttonText || 'Shop Now';
          ctaButton.textContent = buttonText;
          ctaButton.innerHTML = buttonText;
          
          // Ensure button is visible and clickable
          if (ctaButton.style) {
            ctaButton.style.display = 'inline-block';
            ctaButton.style.visibility = 'visible';
            ctaButton.style.opacity = '1';
            ctaButton.style.cursor = 'pointer';
            ctaButton.style.pointerEvents = 'auto';
          }
          
          // Add click handler to scroll to products section
          ctaButton.onclick = (e) => {
            e.preventDefault();
            const productsSection = iframeDoc.querySelector('.products, .products-section, #products, section.products');
            if (productsSection) {
              productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              // Fallback: scroll to first product card
              const firstProduct = iframeDoc.querySelector('.product-card, .product');
              if (firstProduct) {
                firstProduct.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }
          };
          
          // Make sure button is not disabled
          ctaButton.disabled = false;
          ctaButton.removeAttribute('disabled');
          
          console.log('CTA button updated:', buttonText, 'Button element:', ctaButton);
        } else {
          // Try to find any button in hero section as fallback
          const heroButtons = iframeDoc.querySelectorAll('.hero button, .hero-content button');
          if (heroButtons.length > 0) {
            const button = heroButtons[0];
            const buttonText = heroContent.buttonText || 'Shop Now';
            button.textContent = buttonText;
            button.innerHTML = buttonText;
            
            // Add click handler
            button.onclick = (e) => {
              e.preventDefault();
              const productsSection = iframeDoc.querySelector('.products, .products-section, #products');
              if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            };
            
            button.style.display = 'inline-block';
            button.style.cursor = 'pointer';
            button.disabled = false;
            
            console.log('CTA button found via fallback selector:', button);
          } else {
            console.warn('No CTA button found in hero section. Available buttons:', iframeDoc.querySelectorAll('button'));
          }
        }

        // Update products - use products from API (Products table) or fallback to content
        if (displayProducts && Array.isArray(displayProducts) && displayProducts.length > 0) {
          // Find products section/container
          const productsSection = iframeDoc.querySelector('.products, .products-section, #products, section.products');
          const productGrid = iframeDoc.querySelector('.product-grid, .products-grid, .products .product-grid');
          const productContainer = productGrid || productsSection;
          
          if (productContainer) {
            // Get existing product cards
            const existingCards = Array.from(productContainer.querySelectorAll('.product-card, .product'));
            
            // Update existing cards and create new ones for additional products
            displayProducts.forEach((product, index) => {
              let card;
              
              if (existingCards[index]) {
                // Update existing card
                card = existingCards[index];
              } else {
                // Create new product card
                card = iframeDoc.createElement('div');
                card.className = 'product-card';
                
                // Create card structure based on template
                const imageUrl = product.image && product.image !== '/imgplc.jpg'
                  ? (product.image.startsWith('http') ? product.image : getImageUrl(product.image) || product.image)
                  : '/imgplc.jpg';
                
                const price = parseFloat(product.price) || 0;
                let descText = product.description || '';
                if (descText.includes('<p>')) {
                  descText = descText.replace(/^<p>|<\/p>$/g, '').trim();
                }
                
                card.innerHTML = `
                  <img src="${imageUrl}" alt="${product.name || 'Product'}" class="product-image" />
                  <div class="product-info">
                    <h3 class="product-title">${product.name || 'Product'}</h3>
                    <p class="product-description">${descText}</p>
                    <div class="product-footer">
                      <span class="product-price">₱${price.toFixed(2)}</span>
                      <button class="product-button">Order</button>
                    </div>
                  </div>
                `;
                
                // Append new card to container
                productContainer.appendChild(card);
              }
              
              // Update card content (for both existing and newly created cards)
              const titleEl = card.querySelector('.product-title, h3, h4');
              if (titleEl) {
                titleEl.textContent = product.name || '';
              }

              const priceEl = card.querySelector('.product-price, .price');
              if (priceEl) {
                const price = parseFloat(product.price) || 0;
                priceEl.textContent = `₱${price.toFixed(2)}`;
              }

              const descEl = card.querySelector('.product-description, .description, p');
              if (descEl && product.description) {
                let descText = product.description;
                if (descText.includes('<p>')) {
                  descText = descText.replace(/^<p>|<\/p>$/g, '').trim();
                  descEl.innerHTML = descText;
                } else {
                  descEl.textContent = descText;
                }
              }

              const imageEl = card.querySelector('.product-image, img, .product-image img');
              if (imageEl) {
                if (product.image && product.image !== '/imgplc.jpg') {
                  const imageUrl = product.image.startsWith('http') 
                    ? product.image 
                    : getImageUrl(product.image) || product.image;
                  imageEl.src = imageUrl;
                  imageEl.alt = product.name || 'Product';
                  imageEl.style.display = 'block';
                }
              }

              // Remove category labels from product cards
              const categoryEl = card.querySelector('.product-category');
              if (categoryEl) {
                categoryEl.style.display = 'none';
                categoryEl.remove();
              }
              
              // Add click handler to Order/Inquire button
              const orderButton = card.querySelector('.product-button, button');
              if (orderButton) {
                orderButton.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const productData = {
                    type: 'OPEN_ORDER_MODAL',
                    product: product
                  };
                  window.parent.postMessage(productData, '*');
                };
                
                orderButton.style.cursor = 'pointer';
                orderButton.style.pointerEvents = 'auto';
                orderButton.disabled = false;
              }
            });
            
            // Add click handlers to ALL product buttons in the template (including existing ones)
            // This ensures buttons that weren't updated in the loop above still get handlers
            const allProductButtons = iframeDoc.querySelectorAll('.product-button, .product-card button, .product button');
            allProductButtons.forEach((button) => {
              // Find the corresponding product for this button by matching card content
              const card = button.closest('.product-card, .product');
              if (card) {
                // Try to find the product by matching title/name
                const titleEl = card.querySelector('.product-title, h3, h4, .product-name');
                const productName = titleEl ? titleEl.textContent.trim() : '';
                
                // Find matching product
                let matchingProduct = displayProducts.find(p => 
                  p.name && p.name.trim() === productName
                );
                
                // If no match by name, try by index position
                if (!matchingProduct) {
                  const allCards = Array.from(productContainer.querySelectorAll('.product-card, .product'));
                  const cardIndex = allCards.indexOf(card);
                  if (cardIndex >= 0 && cardIndex < displayProducts.length) {
                    matchingProduct = displayProducts[cardIndex];
                  }
                }
                
                // If we found a matching product, attach the handler
                if (matchingProduct) {
                  button.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const productData = {
                      type: 'OPEN_ORDER_MODAL',
                      product: matchingProduct
                    };
                    window.parent.postMessage(productData, '*');
                  };
                  
                  button.style.cursor = 'pointer';
                  button.style.pointerEvents = 'auto';
                  button.disabled = false;
                }
              }
            });
            
            // Remove any extra cards that exceed the number of products
            const allCards = Array.from(productContainer.querySelectorAll('.product-card, .product'));
            if (allCards.length > displayProducts.length) {
              for (let i = displayProducts.length; i < allCards.length; i++) {
                allCards[i].remove();
              }
            }
            
            console.log(`✅ Updated/created ${displayProducts.length} products in published store`);
          } else {
            console.warn('⚠️ Products section not found in template');
          }
        } else {
          console.warn('No products to display');
        }

        // Update logo with store name and add click handler
        const logo = iframeDoc.querySelector('.logo, .navbar .logo');
        if (logo) {
          logo.textContent = store.storeName || 'Store';
          logo.onclick = (e) => {
            e.preventDefault();
            iframeDoc.querySelector('.hero, body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          };
        }

        // Add navigation link functionality and remove About/Gallery links
        const navLinks = iframeDoc.querySelectorAll('.nav-links a, .navbar a');
        navLinks.forEach(link => {
          const linkText = link.textContent.trim().toLowerCase();
          
          // Skip if it's the logo (already handled above)
          if (link.classList.contains('logo')) return;
          
          // Remove About and Gallery links
          if (linkText === 'about' || linkText === 'gallery') {
            link.style.display = 'none';
            link.remove();
            return;
          }
          
          link.onclick = (e) => {
            e.preventDefault();
            
            let targetSection = null;
            
            switch(linkText) {
              case 'home':
                targetSection = iframeDoc.querySelector('.hero, body');
                break;
              case 'products':
                targetSection = iframeDoc.querySelector('.products, .products-section, #products, section.products');
                break;
              case 'contact':
                // Contact section or footer
                targetSection = iframeDoc.querySelector('.contact, .contact-section, #contact, section.contact, footer');
                break;
              default:
                // Try to find by text content
                targetSection = iframeDoc.querySelector(`#${linkText}, .${linkText}, section.${linkText}`);
            }
            
            if (targetSection) {
              targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              // Final fallback: scroll based on link type
              if (linkText === 'home') {
                iframeDoc.querySelector('.hero, body')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else if (linkText === 'products') {
                const productsSection = iframeDoc.querySelector('.products, .products-section');
                if (productsSection) {
                  productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              } else if (linkText === 'contact') {
                // Scroll to footer for contact
                const footer = iframeDoc.querySelector('footer');
                if (footer) {
                  footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            }
          };
          
          // Ensure links are clickable
          link.style.cursor = 'pointer';
          link.style.pointerEvents = 'auto';
        });

        // Update store name in any visible places
        const storeNameElements = iframeDoc.querySelectorAll('[data-store-name]');
        storeNameElements.forEach(el => {
          el.textContent = store.storeName;
        });

        // Remove About section if it exists (we don't want it in published websites)
        const aboutSection = iframeDoc.querySelector('.about, .about-section, #about, section.about');
        if (aboutSection) {
          aboutSection.remove();
        }

        // Create or update Contact section
        let contactSection = iframeDoc.querySelector('.contact, .contact-section, #contact, section.contact');
        const hasAddress = store.barangay || store.municipality || store.province || store.region;
        if (!contactSection && (store.contactEmail || store.phone || hasAddress)) {
          const footer = iframeDoc.querySelector('footer');
          if (footer) {
            contactSection = iframeDoc.createElement('section');
            contactSection.className = 'contact-section';
            contactSection.id = 'contact';
            contactSection.style.cssText = 'padding: 8rem 5%; max-width: 1400px; margin: 0 auto; background: #1a1a1a; color: #e0e0e0;';
            
            const contactContent = iframeDoc.createElement('div');
            contactContent.style.cssText = 'text-align: center; max-width: 800px; margin: 0 auto;';
            
            const contactTitle = iframeDoc.createElement('h2');
            contactTitle.textContent = 'Contact Us';
            contactTitle.style.cssText = 'font-size: 3rem; font-weight: 300; letter-spacing: 4px; margin-bottom: 2rem; color: #c9a961; text-transform: uppercase;';
            
            const contactLine = iframeDoc.createElement('div');
            contactLine.style.cssText = 'width: 100px; height: 2px; background: #c9a961; margin: 0 auto 3rem;';
            
            const contactInfo = iframeDoc.createElement('div');
            contactInfo.style.cssText = 'display: flex; flex-direction: column; gap: 2rem; align-items: center;';
            
            // Address
            const addressParts = [];
            if (store.barangay) addressParts.push(store.barangay);
            if (store.municipality) addressParts.push(store.municipality);
            if (store.province) addressParts.push(store.province);
            if (store.region) addressParts.push(store.region);
            
            if (addressParts.length > 0) {
              const addressDiv = iframeDoc.createElement('div');
              addressDiv.style.cssText = 'font-size: 1rem; color: #999;';
              addressDiv.innerHTML = `<strong style="color: #c9a961; display: block; margin-bottom: 0.5rem;">Address:</strong>${addressParts.join(', ')}`;
              contactInfo.appendChild(addressDiv);
            }
            
            // Email
            if (store.contactEmail) {
              const emailDiv = iframeDoc.createElement('div');
              emailDiv.style.cssText = 'font-size: 1rem; color: #999;';
              const emailLink = iframeDoc.createElement('a');
              emailLink.href = `mailto:${store.contactEmail}`;
              emailLink.textContent = store.contactEmail;
              emailLink.style.cssText = 'color: #c9a961; text-decoration: none; transition: color 0.3s;';
              emailLink.onmouseover = () => emailLink.style.color = '#e0e0e0';
              emailLink.onmouseout = () => emailLink.style.color = '#c9a961';
              emailDiv.innerHTML = `<strong style="color: #c9a961; display: block; margin-bottom: 0.5rem;">Email:</strong>`;
              emailDiv.appendChild(emailLink);
              contactInfo.appendChild(emailDiv);
            }
            
            // Phone
            if (store.phone) {
              const phoneDiv = iframeDoc.createElement('div');
              phoneDiv.style.cssText = 'font-size: 1rem; color: #999;';
              const phoneLink = iframeDoc.createElement('a');
              phoneLink.href = `tel:${store.phone}`;
              phoneLink.textContent = store.phone;
              phoneLink.style.cssText = 'color: #c9a961; text-decoration: none; transition: color 0.3s;';
              phoneLink.onmouseover = () => phoneLink.style.color = '#e0e0e0';
              phoneLink.onmouseout = () => phoneLink.style.color = '#c9a961';
              phoneDiv.innerHTML = `<strong style="color: #c9a961; display: block; margin-bottom: 0.5rem;">Phone:</strong>`;
              phoneDiv.appendChild(phoneLink);
              contactInfo.appendChild(phoneDiv);
            }
            
            contactContent.appendChild(contactTitle);
            contactContent.appendChild(contactLine);
            contactContent.appendChild(contactInfo);
            contactSection.appendChild(contactContent);
            footer.parentNode.insertBefore(contactSection, footer);
          }
        } else if (contactSection) {
          // Update existing Contact section
          if (store.contactEmail) {
            const emailElements = contactSection.querySelectorAll('[data-store-email], .contact-email, a[href^="mailto:"]');
            emailElements.forEach(el => {
              if (el.tagName === 'A' && el.href.startsWith('mailto:')) {
                el.href = `mailto:${store.contactEmail}`;
                el.textContent = store.contactEmail;
              } else {
                el.textContent = store.contactEmail;
              }
            });
          }
          
          if (store.phone) {
            const phoneElements = contactSection.querySelectorAll('[data-store-phone], .contact-phone, a[href^="tel:"]');
            phoneElements.forEach(el => {
              if (el.tagName === 'A' && el.href.startsWith('tel:')) {
                el.href = `tel:${store.phone}`;
                el.textContent = store.phone;
              } else {
                el.textContent = store.phone;
              }
            });
          }
          
          const addressParts = [];
          if (store.barangay) addressParts.push(store.barangay);
          if (store.municipality) addressParts.push(store.municipality);
          if (store.province) addressParts.push(store.province);
          if (store.region) addressParts.push(store.region);
          
          if (addressParts.length > 0) {
            const addressText = addressParts.join(', ');
            const addressElements = contactSection.querySelectorAll('[data-store-address], .contact-address, .address');
            addressElements.forEach(el => {
              el.textContent = addressText;
            });
          }
        }

        // Update domain name if shown anywhere
        if (store.domainName) {
          const domainElements = iframeDoc.querySelectorAll('[data-store-domain]');
          domainElements.forEach(el => {
            el.textContent = store.domainName;
          });
        }

      } catch (error) {
        console.error('Error updating iframe:', error);
      }
    };

    // Wait for iframe to load and retry if needed
    let retryCount = 0;
    const maxRetries = 5;
    
    const tryUpdate = () => {
      updateIframe();
      retryCount++;
      if (retryCount < maxRetries) {
        // Retry after a short delay to catch late-loading elements
        setTimeout(tryUpdate, 500);
      }
    };
    
    // Initial delay to let iframe load
    const timer1 = setTimeout(tryUpdate, 200);
    
    // Also listen for iframe load event
    const iframe = iframeRef.current;
    const handleLoad = () => {
      setTimeout(updateIframe, 100);
    };
    
    if (iframe) {
      iframe.addEventListener('load', handleLoad);
    }
    
    return () => {
      clearTimeout(timer1);
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
    };
  }, [store, htmlContent, products]);

  // Listen for messages from iframe to open order modal
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'OPEN_ORDER_MODAL' && event.data.product) {
        const product = event.data.product;
        setSelectedProduct(product);
        setShowOrderModal(true);
        
        // Reset order form
        setOrderData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          quantity: 1,
          paymentMethod: 'gcash',
          region: '',
          province: '',
          municipality: '',
          barangay: '',
          shipping: 0
        });
        setProvincesList([]);
        setMunicipalitiesList([]);
        setBarangaysList([]);
        setOrderError('');
        setOrderSuccess(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Store Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || 'This store is not available or has not been published yet.'}
          </p>
          <div className="mt-4 text-sm text-gray-500">
            <p>URL: <code className="bg-gray-200 px-2 py-1 rounded">{window.location.href}</code></p>
            <p className="mt-2">Domain from URL: <code className="bg-gray-200 px-2 py-1 rounded">{domain}</code></p>
          </div>
          <a 
            href="/" 
            className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  // Handle order form changes
  const handleOrderChange = (field, value) => {
    if (field === 'region') {
      setProvincesList(getProvincesByRegion(value));
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setOrderData(prev => ({ ...prev, [field]: value, province: '', municipality: '', barangay: '' }));
    } else if (field === 'province') {
      setMunicipalitiesList(getCityMunByProvince(value));
      setBarangaysList([]);
      setOrderData(prev => ({ ...prev, [field]: value, municipality: '', barangay: '' }));
    } else if (field === 'municipality') {
      const barangaysData = getBarangayByMun(value);
      const barangaysArray = barangaysData?.data || barangaysData || [];
      setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
        brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
        name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
      })) : []);
      setOrderData(prev => ({ ...prev, [field]: value, barangay: '' }));
    } else {
      setOrderData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle order submission
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderError('');
    setOrderLoading(true);

    try {
      if (!selectedProduct || !store) {
        setOrderError('Product or store information missing');
        return;
      }

      // Validate required fields
      if (!orderData.customerName || !orderData.customerEmail || !orderData.paymentMethod) {
        setOrderError('Please fill in all required fields');
        return;
      }

      if (!orderData.region || !orderData.province || !orderData.municipality || !orderData.barangay) {
        setOrderError('Please select complete shipping address');
        return;
      }

      // Build shipping address
      const shippingAddress = {
        region: orderData.region,
        province: orderData.province,
        municipality: orderData.municipality,
        barangay: orderData.barangay
      };

      // Create order
      const orderPayload = {
        storeId: store.id,
        items: [{
          productId: selectedProduct.id,
          quantity: parseInt(orderData.quantity) || 1
        }],
        shippingAddress,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone || '',
        paymentMethod: orderData.paymentMethod,
        shipping: parseFloat(orderData.shipping) || 0
      };

      const response = await apiClient.post('/orders', orderPayload);

      setOrderSuccess(true);
      setOrderError('');
      
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowOrderModal(false);
        setOrderSuccess(false);
        setSelectedProduct(null);
      }, 3000);
    } catch (err) {
      console.error('Error creating order:', err);
      setOrderError(err.response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  // Calculate order total
  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    const subtotal = parseFloat(selectedProduct.price || 0) * (parseInt(orderData.quantity) || 1);
    const shipping = parseFloat(orderData.shipping) || 0;
    return subtotal + shipping;
  };

  return (
    <>
      {/* Order Modal */}
      {showOrderModal && selectedProduct && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !orderLoading && setShowOrderModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Place Your Order</h2>
                <button
                  onClick={() => !orderLoading && setShowOrderModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  disabled={orderLoading}
                >
                  ×
                </button>
              </div>

              {/* Product Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{selectedProduct.name}</h3>
                <p className="text-gray-600 mb-2">Price: ₱{parseFloat(selectedProduct.price || 0).toFixed(2)}</p>
                {selectedProduct.stock !== undefined && (
                  <p className="text-sm text-gray-500">Stock Available: {selectedProduct.stock}</p>
                )}
              </div>

              {orderSuccess ? (
                <div className="text-center py-8">
                  <div className="text-green-600 text-5xl mb-4">✓</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h3>
                  <p className="text-gray-600">Thank you for your order. The store owner will contact you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  {/* Customer Information */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={orderData.customerName}
                          onChange={(e) => handleOrderChange('customerName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          value={orderData.customerEmail}
                          onChange={(e) => handleOrderChange('customerEmail', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={orderData.customerPhone}
                          onChange={(e) => handleOrderChange('customerPhone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.stock || 999}
                      required
                      value={orderData.quantity}
                      onChange={(e) => handleOrderChange('quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Shipping Address</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                        <select
                          required
                          value={orderData.region}
                          onChange={(e) => handleOrderChange('region', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select Region</option>
                          {regionsList.map((region) => (
                            <option key={region.reg_code} value={region.reg_code}>
                              {region.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                        <select
                          required
                          value={orderData.province}
                          onChange={(e) => handleOrderChange('province', e.target.value)}
                          disabled={!orderData.region}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        >
                          <option value="">Select Province</option>
                          {provincesList.map((province) => (
                            <option key={province.prov_code} value={province.prov_code}>
                              {province.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Municipality *</label>
                        <select
                          required
                          value={orderData.municipality}
                          onChange={(e) => handleOrderChange('municipality', e.target.value)}
                          disabled={!orderData.province}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        >
                          <option value="">Select Municipality</option>
                          {municipalitiesList.map((municipality) => (
                            <option key={municipality.mun_code} value={municipality.mun_code}>
                              {municipality.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                        <select
                          required
                          value={orderData.barangay}
                          onChange={(e) => handleOrderChange('barangay', e.target.value)}
                          disabled={!orderData.municipality}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        >
                          <option value="">Select Barangay</option>
                          {barangaysList.map((barangay) => (
                            <option key={barangay.brgy_code} value={barangay.name}>
                              {barangay.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Fee (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={orderData.shipping}
                      onChange={(e) => handleOrderChange('shipping', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Payment Method *</h3>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="gcash"
                          checked={orderData.paymentMethod === 'gcash'}
                          onChange={(e) => handleOrderChange('paymentMethod', e.target.value)}
                          className="mr-3"
                        />
                        <span>GCash</span>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paypal"
                          checked={orderData.paymentMethod === 'paypal'}
                          onChange={(e) => handleOrderChange('paymentMethod', e.target.value)}
                          className="mr-3"
                        />
                        <span>PayPal</span>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={orderData.paymentMethod === 'card'}
                          onChange={(e) => handleOrderChange('paymentMethod', e.target.value)}
                          className="mr-3"
                        />
                        <span>Credit/Debit Card</span>
                      </label>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₱{((parseFloat(selectedProduct.price || 0) * (parseInt(orderData.quantity) || 1)).toFixed(2))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>₱{parseFloat(orderData.shipping || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300">
                        <span>Total:</span>
                        <span>₱{calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {orderError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {orderError}
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowOrderModal(false)}
                      disabled={orderLoading}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={orderLoading}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {orderLoading ? 'Processing...' : 'Place Order'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-screen" style={{ overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          src={`/templates/${templateFileMap[store.templateId] || 'struvaris.html'}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            pointerEvents: 'auto'
          }}
          title={store.storeName}
          scrolling="yes"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          onLoad={() => {
            // Trigger update when iframe loads
            if (iframeRef.current && htmlContent) {
              const event = new Event('updatePreview');
              window.dispatchEvent(event);
            }
          }}
        />
      </div>
    </>
  );
};

export default PublishedStore;

