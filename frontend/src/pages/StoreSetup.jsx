import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { regions, getProvincesByRegion, getCityMunByProvince, getBarangayByMun } from 'phil-reg-prov-mun-brgy';
import Header from '../components/Header';
import '../styles/StoreSetup.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StoreSetup = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
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

  const [regionsList, setRegionsList] = useState([]);
  const [provincesList, setProvincesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load regions on component mount
    try {
      setRegionsList(regions);
    } catch (error) {
      setRegionsList([]);
    }
  }, []);

  useEffect(() => {
    // Load provinces when region changes
    if (formData.region) {
      try {
        const provincesData = getProvincesByRegion(formData.region);
        setProvincesList(provincesData);
        setFormData(prev => ({ ...prev, province: '', municipality: '', barangay: '' }));
      } catch (error) {
        setProvincesList([]);
      }
    } else {
      setProvincesList([]);
    }
  }, [formData.region]);

  useEffect(() => {
    // Load municipalities when province changes
    if (formData.province) {
      try {
        const municipalitiesData = getCityMunByProvince(formData.province);
        setMunicipalitiesList(municipalitiesData);
        setFormData(prev => ({ ...prev, municipality: '', barangay: '' }));
      } catch (error) {
        setMunicipalitiesList([]);
      }
    } else {
      setMunicipalitiesList([]);
    }
  }, [formData.province]);

  useEffect(() => {
    // Load barangays when municipality changes
    if (formData.municipality) {
      try {
        const barangaysData = getBarangayByMun(formData.municipality);
        const barangaysArray = barangaysData?.data || barangaysData || [];
        
        const processedBarangays = Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
          brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
          name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
        })) : [];
        
        setBarangaysList(processedBarangays);
        setFormData(prev => ({ ...prev, barangay: '' }));
      } catch (error) {
        setBarangaysList([]);
      }
    } else {
      setBarangaysList([]);
    }
  }, [formData.municipality]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to create a store');
        return;
      }

      console.log('Submitting store data:', {
        templateId,
        ...formData
      });

      const response = await axios.post('http://localhost:5000/api/stores', {
        templateId,
        ...formData
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Store creation response:', response.data);
      // Redirect to dashboard after successful store creation
      navigate('/dashboard');
    } catch (error) {
      console.error('Store creation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.message === 'Network Error') {
        setError('Cannot connect to the server. Please make sure the backend server is running.');
      } else {
        setError(
          error.response?.data?.message || 
          'An error occurred while creating your store. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="store-setup-page">
      <Header />
      <div className="store-setup-content">
        <div className="setup-header">
          <h1>Set Up Your Store</h1>
          <p>Fill in your store details to get started</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form className="setup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="storeName">Store Name</label>
            <input
              type="text"
              id="storeName"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              required
              placeholder="Enter your store name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Store Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe your store and what you offer"
            />
          </div>

          <div className="form-group">
            <label htmlFor="domainName">Desired Domain Name</label>
            <div className="domain-input-group">
              <input
                type="text"
                id="domainName"
                name="domainName"
                value={formData.domainName}
                onChange={handleChange}
                required
                placeholder="your-store-name"
                className="domain-input"
              />
              <span className="domain-suffix">.structura.com</span>
            </div>
            <small className="domain-hint">Example: my-craft-store.structura.com</small>
          </div>

          <div className="form-group">
            <label htmlFor="region">Region</label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
            >
              <option key="region-default" value="">Select Region</option>
              {regionsList.filter(region => region.reg_code).map((region, index) => (
                <option key={`region-${region.reg_code}-${index}`} value={region.reg_code}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="province">Province</label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              required
              disabled={!formData.region}
            >
              <option key="province-default" value="">Select Province</option>
              {provincesList.filter(province => province.prov_code).map((province, index) => (
                <option key={`province-${province.prov_code}-${index}`} value={province.prov_code}>
                  {province.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="municipality">City/Municipality</label>
            <select
              id="municipality"
              name="municipality"
              value={formData.municipality}
              onChange={handleChange}
              required
              disabled={!formData.province}
            >
              <option key="municipality-default" value="">Select City/Municipality</option>
              {municipalitiesList.filter(municipality => municipality.mun_code).map((municipality, index) => (
                <option key={`municipality-${municipality.mun_code}-${index}`} value={municipality.mun_code}>
                  {municipality.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="barangay">Barangay</label>
            <select
              id="barangay"
              name="barangay"
              value={formData.barangay}
              onChange={handleChange}
              required
              disabled={!formData.municipality}
            >
              <option key="barangay-default" value="">Select Barangay</option>
              {Array.isArray(barangaysList) && barangaysList.length > 0 ? (
                barangaysList.map((barangay, index) => {
                  if (!barangay.brgy_code && !barangay.name) {
                    return null;
                  }
                  
                  const optionValue = barangay.brgy_code || `brgy-${index}`;
                  const optionLabel = barangay.name || `BARANGAY ${index + 1}`;
                  
                  return (
                    <option 
                      key={`barangay-${optionValue}`} 
                      value={optionValue}
                    >
                      {optionLabel}
                    </option>
                  );
                }).filter(Boolean)
              ) : (
                <option value="" disabled>No barangays available</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="contactEmail">Contact Email</label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              required
              placeholder="Enter your contact email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Store...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreSetup;