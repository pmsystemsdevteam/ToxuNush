import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminPage from '../Page/AdminPage/AdminPage';
import AdminTablePage from '../Page/AdminTablePage/AdminTablePage';
import AdminProductPage from '../Page/AdminProdcutPage/AdminProductPage';
import AdminAddPage from '../Page/AdminAddPage/AdminAddPage';
import AdminEditPage from '../Page/AdminEditPage/AdminEditPage';
import AdminCatagoryAddPage from '../Page/AdminCatagoryAddPage/AdminCatagoryAddPage';
import AdminCategoryPage from '../Page/AdminCategoryPage/AdminCategoryPage';
import AdminCatagoryEditPage from '../Page/AdminCatagoryEditPage/AdminCatagoryEditPage';
import AdminArcitecturePage from '../Page/AdminArcitecturePage/AdminArcitecturePage';
import Dashboard from './Dashboard/Dashboard';
import ScrollToTop from '../Components/ScrollToTop';

function AdminLayout() {
  return (
    <div className="admin-layout">
      <ScrollToTop behavior="smooth" /> 
      <Dashboard />
      <Routes>
        <Route path="/" element={<AdminTablePage />} />

        <Route path="product" element={<AdminProductPage />} />
        <Route path="product/add" element={<AdminAddPage />} />
        <Route path="product/edit/:id" element={<AdminEditPage />} />

        <Route path="category" element={<AdminCatagoryAddPage />} />
        <Route path="category/add" element={<AdminCategoryPage/>} />
        <Route path="category/edit/:id" element={<AdminCatagoryEditPage />} />
        
        <Route path="architecture" element={<AdminArcitecturePage />} />
      </Routes>
    </div>
  );
}

export default AdminLayout;
