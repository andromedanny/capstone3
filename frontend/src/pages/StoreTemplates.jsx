import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/StoreTemplates.css';

const StoreTemplates = () => {
  const templates = [
    {
      id: 'bladesmith',
      title: 'Bladesmith & Swordsmith',
      description: 'Showcase your handcrafted blades, swords, and custom weapons with this medieval-inspired template.',
      image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      features: ['Custom Order System', 'Product Gallery', 'Crafting Process', 'Materials Showcase'],
      isPopular: true
    },
    {
      id: 'pottery',
      title: 'Pottery Studio',
      description: 'Perfect for showcasing your ceramic art and pottery creations with an artistic, earthy design.',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      features: ['Artistic Gallery', 'Workshop Schedule', 'Custom Orders', 'Material Information']
    },
    {
      id: 'balisong',
      title: 'Balisong & Knife Collection',
      description: 'Modern template for displaying your custom balisong and knife collection with detailed specifications.',
      image: 'https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      features: ['Product Specifications', 'Collection Showcase', 'Custom Designs', 'Technical Details']
    },
    {
      id: 'weavery',
      title: 'Weavery & Textile Arts',
      description: 'Elegant template for showcasing handwoven textiles, tapestries, and fiber arts.',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      features: ['Pattern Gallery', 'Material Showcase', 'Custom Orders', 'Weaving Process']
    },
    {
      id: 'woodcarving',
      title: 'Wood Carving Studio',
      description: 'Rustic template perfect for displaying your hand-carved wooden sculptures and decorative pieces.',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      features: ['Gallery Display', 'Custom Commissions', 'Wood Types', 'Carving Techniques']
    }
  ];

  return (
    <div className="templates-page">
      <Header />
      
      <div className="templates-content">
        <div className="templates-header">
          <p className="select-template-text">Select a template that best fits your craft business</p>
        </div>

        <div className="templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-preview">
                <img src={template.image} alt={template.title} />
                {template.isPopular && <div className="template-badge">Popular</div>}
              </div>
              <div className="template-info">
                <h3 className="template-title">{template.title}</h3>
                <p className="template-description">{template.description}</p>
                <ul className="template-features">
                  {template.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <div className="template-buttons">
                  <Link to={`/store/${template.id}`} className="preview-button">
                    <i className="fas fa-eye"></i> Preview Template
                  </Link>
                  <Link to={`/store-setup/${template.id}`} className="select-button">
                    <i className="fas fa-check"></i> Use This Template
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreTemplates; 