// src/layouts/DashboardLayout.jsx
import Header from '../components/Header';
import Sidebar from '../components/Sidebar'; // create this next
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64"> {/* Added ml-64 to offset the sidebar width */}
        <Header />
        <main className="mt-20 p-4"> {/* Adjust margin top to match your header height */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
