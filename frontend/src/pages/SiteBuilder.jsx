import React, { useState } from 'react';
import '../styles/SiteBuilder.css';

import BalisongStore from './stores/BalisongStore.jsx';
import BladesmithStore from './stores/BladesmithStore.jsx';
import PotteryStore from './stores/PotteryStore.jsx';
import WeaveryStore from './stores/WeaveryStore.jsx';
import WoodCarvingStore from './stores/WoodCarvingStore.jsx';

import BalisongStoreContent from './stores/BalisongStore.content.json';
import BladesmithStoreContent from './stores/BladesmithStore.content.json';
import PotteryStoreContent from './stores/PotteryStore.content.json';
import WeaveryStoreContent from './stores/WeaveryStore.content.json';
import WoodCarvingStoreContent from './stores/WoodCarvingStore.content.json';

const STORE_TEMPLATES = [
  {
    name: 'BalisongStore',
    component: BalisongStore,
    filePath: 'frontend/src/pages/stores/BalisongStore.content.json',
    defaultContent: BalisongStoreContent,
  },
  {
    name: 'BladesmithStore',
    component: BladesmithStore,
    filePath: 'frontend/src/pages/stores/BladesmithStore.content.json',
    defaultContent: BladesmithStoreContent,
  },
  {
    name: 'PotteryStore',
    component: PotteryStore,
    filePath: 'frontend/src/pages/stores/PotteryStore.content.json',
    defaultContent: PotteryStoreContent,
  },
  {
    name: 'WeaveryStore',
    component: WeaveryStore,
    filePath: 'frontend/src/pages/stores/WeaveryStore.content.json',
    defaultContent: WeaveryStoreContent,
  },
  {
    name: 'WoodCarvingStore',
    component: WoodCarvingStore,
    filePath: 'frontend/src/pages/stores/WoodCarvingStore.content.json',
    defaultContent: WoodCarvingStoreContent,
  },
];

export default function SiteBuilder() {
  // Default to the first store template
  const [selectedStore] = useState(STORE_TEMPLATES[0]);
  const [content, setContent] = useState(selectedStore.defaultContent);
  const [status, setStatus] = useState('');

  const handleContentChange = (section, value) => {
    setContent(prev => ({ ...prev, [section]: value }));
  };

  const handleSave = async () => {
    try {
      // In dev: would write to file system or call an API
      setStatus('Saved successfully! (In dev, this would write to the file)');
    } catch (e) {
      setStatus('Error saving: ' + e.message);
    }
  };

  const StoreComponent = selectedStore.component;

  return (
    <div className="site-builder-editor" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <main className="site-builder-main" style={{ width: '100%', padding: 0, margin: 0 }}>
        <div style={{ width: '100vw', minHeight: '90vh', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb', borderRadius: 0, overflow: 'auto' }}>
          <StoreComponent {...content} onContentChange={handleContentChange} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0' }}>
          <button className="save-btn" onClick={handleSave}>Save Changes</button>
          {status && <div className="save-status">{status}</div>}
        </div>
      </main>
    </div>
  );
} 