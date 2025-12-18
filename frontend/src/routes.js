import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import StudentDetail from './components/StudentDetail';
import AnalyticsPage from './pages/AnalyticsPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<StudentList />} />
      <Route path="/students/new" element={<StudentForm />} />
      <Route path="/students/:id/edit" element={<StudentForm />} />
      <Route path="/students/:id" element={<StudentDetail />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
    </Routes>
  );
};

export default AppRoutes;