import React, { useState } from 'react';
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
    phone: '',
  });
  const [regionsList] = useState(regions);
  const [provincesList, setProvincesList] = useState([]);
  const [municipalitiesList, setMunicipalitiesList] = useState([]);
  const [barangaysList, setBarangaysList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'region') {
      setProvincesList(getProvincesByRegion(value));
      setMunicipalitiesList([]);
      setBarangaysList([]);
      setFormData(prev => ({ ...prev, province: '', municipality: '', barangay: '' }));
    }
    if (name === 'province') {
      setMunicipalitiesList(getCityMunByProvince(value));
      setBarangaysList([]);
      setFormData(prev => ({ ...prev, municipality: '', barangay: '' }));
    }
    if (name === 'municipality') {
      const barangaysData = getBarangayByMun(value);
      const barangaysArray = barangaysData?.data || barangaysData || [];
      setBarangaysList(Array.isArray(barangaysArray) ? barangaysArray.map(brgy => ({
        brgy_code: brgy.brgy_code || brgy.code || brgy.brgyCode || '',
        name: (brgy.name || brgy.brgy_name || brgy.brgyName || '').toUpperCase()
      })) : []);
      setFormData(prev => ({ ...prev, barangay: '' }));
    }
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
      const payload = {
        templateId,
        ...formData
      };
      console.log('Sending payload:', payload);
      const response = await axios.post('http://localhost:5000/api/stores', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Response:', response.data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
      setError('An error occurred while creating your store. Please try again.');
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
          <div className="error-message">{error}</div>
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
            <div className="domain-input-container">
              <input
                type="text"
                id="domainName"
                name="domainName"
                value={formData.domainName}
                onChange={handleChange}
                required
                placeholder="Enter your domain name"
                style={{ width: '70%' }}
              />
              <span className="domain-suffix">.structura.com</span>
            </div>
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
              <option value="">Select Region</option>
              {regionsList.map(region => (
                <option key={region.reg_code} value={region.reg_code}>{region.name}</option>
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
              disabled={!provincesList.length}
            >
              <option value="">Select Province</option>
              {provincesList.map(province => (
                <option key={province.prov_code} value={province.prov_code}>{province.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="municipality">Municipality/City</label>
            <select
              id="municipality"
              name="municipality"
              value={formData.municipality}
              onChange={handleChange}
              required
              disabled={!municipalitiesList.length}
            >
              <option value="">Select Municipality/City</option>
              {municipalitiesList.map(mun => (
                <option key={mun.mun_code} value={mun.mun_code}>{mun.name}</option>
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
              disabled={!barangaysList.length}
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
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Store Details'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StoreSetup;