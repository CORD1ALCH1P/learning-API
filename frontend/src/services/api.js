import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Вспомогательная функция для очистки параметров (удаляет пустые значения)
const cleanParams = (params) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

// Сервис для работы со студентами
export const studentAPI = {
  // Получить всех студентов с пагинацией
  getAll: (params = {}) => {
    const cleanedParams = cleanParams(params);
    return api.get('/students/', { params: cleanedParams });
  },
  
  // Получить студента по ID
  getById: (id) => api.get(`/students/${id}`),
  
  // Создать студента
  create: (studentData) => api.post('/students/', studentData),
  
  // Обновить студента
  update: (id, studentData) => api.put(`/students/${id}`, studentData),
  
  // Удалить студента
  delete: (id) => api.delete(`/students/${id}`),
  
  // Поиск студентов
  search: (query) => {
    const cleanedParams = cleanParams({ query });
    return api.get('/students/search/', { params: cleanedParams });
  },
  
  // Получить статистику студента
  getStats: (id) => api.get(`/students/${id}/stats`),
  
  // Получить статистику факультета
  getFacultyStats: (faculty) => api.get(`/students/faculty/${faculty}/stats`),
};

// Сервис для работы с оценками
export const gradeAPI = {
  // Получить оценки студента
  getByStudent: (studentId, params = {}) => {
    const cleanedParams = cleanParams(params);
    return api.get(`/grades/student/${studentId}`, { params: cleanedParams });
  },
  
  // Создать оценку
  create: (gradeData) => api.post('/grades/', gradeData),
  
  // Обновить оценку
  update: (id, gradeData) => api.put(`/grades/${id}`, gradeData),
  
  // Удалить оценку
  delete: (id) => api.delete(`/grades/${id}`),
  
  // Получить средний балл
  getAverage: (studentId, semester = null) => {
    const params = semester ? { semester } : {};
    const cleanedParams = cleanParams(params);
    return api.get(`/grades/student/${studentId}/average`, { params: cleanedParams });
  },
  
  // Топ студентов по факультету
  getTopStudents: (faculty, limit = 10) => {
    const cleanedParams = cleanParams({ limit });
    return api.get(`/grades/top/${faculty}`, { params: cleanedParams });
  },
  
  // Успеваемость по предметам
  getSubjectsPerformance: (semester = null) => {
    const params = semester ? { semester } : {};
    const cleanedParams = cleanParams(params);
    return api.get('/grades/subjects/performance', { params: cleanedParams });
  },
};

export default api;