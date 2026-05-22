import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import LearnerDashboard from './pages/LearnerDashboard';
import ShadowingPage from './pages/Shadowing';
import ShadowingPracticePage from './pages/ShadowingPracticePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang chủ Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Nhóm các trang Dashboard dùng chung Layout Sidebar */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Khi truy cập /dashboard, nó sẽ load nội dung từ LearnerDashboard vào phần Outlet */}
          <Route index element={<LearnerDashboard />} />
          <Route path="shadowing" element={<ShadowingPage />} />
          <Route path="shadowing/practice" element={<ShadowingPracticePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;