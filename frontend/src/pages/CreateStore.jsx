import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import phil from 'phil-reg-prov-mun-brgy';
import { useAuth } from '../context/AuthContext';
import WebsiteTemplate from '../components/WebsiteTemplate';
import { websiteTemplates } from '../data/websiteTemplates';

const CreateStore = () => {
  const navigate = useNavigate();
  const { setStoreCreated } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [step, setStep] = useState(1); // 1 for template selection, 2 for store details
  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    region: '',
    province: '',
    city: ''
  });

  const [locations, setLocations] = useState({
    regions: [],
    provinces: [],
    cities: []
  });

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(websiteTemplates.map(template => template.category))];
    return ['All', ...uniqueCategories.sort()];
  }, []);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'All') return websiteTemplates;
    return websiteTemplates.filter(template => template.category === selectedCategory);
  }, [selectedCategory]);

  // Load regions on component mount
  useEffect(() => {
    setLocations(prev => ({
      ...prev,
      regions: phil.regions
    }));
  }, []);

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const handleNextStep = () => {
    if (selectedTemplate) {
      setStep(2);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset dependent fields
      ...(name === 'region' && { province: '', city: '' }),
      ...(name === 'province' && { city: '' })
    }));

    // Update dependent dropdowns
    if (name === 'region') {
      const provinces = phil.getProvincesByRegion(value);
      setLocations(prev => ({
        ...prev,
        provinces,
        cities: []
      }));
    } else if (name === 'province') {
      const cities = phil.getCityMunByProvince(value);
      setLocations(prev => ({
        ...prev,
        cities
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // TODO: Add your API call here to create the store
      // const response = await axios.post('/api/stores', { ...formData, templateId: selectedTemplate });
      console.log('Store data:', { ...formData, templateId: selectedTemplate });
      setStoreCreated();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating store:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicHeader />
      <div className="pt-24 px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Create Your Store</h1>
          
          {step === 1 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Choose a Template</h2>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map(template => (
                  <WebsiteTemplate
                    key={template.id}
                    template={template}
                    selected={selectedTemplate === template.id}
                    onSelect={handleTemplateSelect}
                  />
                ))}
              </div>

              <div className="flex justify-center mt-8">
                <button
                  onClick={handleNextStep}
                  disabled={!selectedTemplate}
                  className={`px-8 py-3 rounded-lg text-white font-semibold transition duration-200 ${
                    selectedTemplate 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Continue with Selected Template
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-6">Store Details</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                      Region
                    </label>
                    <select
                      id="region"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                    >
                      <option value="">Select Region</option>
                      {locations.regions.map(region => (
                        <option key={region.reg_code} value={region.reg_code}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                      Province
                    </label>
                    <select
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                      disabled={!formData.region}
                    >
                      <option value="">Select Province</option>
                      {locations.provinces.map(province => (
                        <option key={province.prov_code} value={province.prov_code}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City/Municipality
                    </label>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                      required
                      disabled={!formData.province}
                    >
                      <option value="">Select City/Municipality</option>
                      {locations.cities.map(city => (
                        <option key={city.mun_code} value={city.mun_code}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="storeDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Store Description
                  </label>
                  <textarea
                    id="storeDescription"
                    name="storeDescription"
                    value={formData.storeDescription}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Back to Templates
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                  >
                    Create Store
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateStore; 