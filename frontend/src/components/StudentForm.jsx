import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentAPI } from '../services/api';

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    faculty: '',
    group: '',
    enrollment_year: new Date().getFullYear()
  });

  useEffect(() => {
    if (isEditMode) {
      fetchStudent();
    }
  }, [id]);

  // Загрузка данных студента для редактирования
  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getById(id);
      setFormData(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке данных студента:', err);
      setError('Не удалось загрузить данные студента');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.student_id.trim()) {
      setError('Введите номер студенческого билета');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Введите корректный email');
      return false;
    }
    if (formData.enrollment_year < 2000 || formData.enrollment_year > 2100) {
      setError('Год поступления должен быть между 2000 и 2100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');
      
      if (isEditMode) {
        await studentAPI.update(id, formData);
        setSuccess('Данные студента успешно обновлены!');
      } else {
        await studentAPI.create(formData);
        setSuccess('Студент успешно создан!');
      }
      
      // Перенаправление через 2 секунды
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      console.error('Ошибка при сохранении:', err);
      const errorMsg = err.response?.data?.detail || 'Ошибка при сохранении';
      setError(Array.isArray(errorMsg) ? errorMsg[0].msg : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h1 style={styles.title}>
          {isEditMode ? 'Редактирование студента' : 'Добавление нового студента'}
        </h1>

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={styles.success}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGrid}>
            {/* Основная информация */}
            <h3 style={styles.sectionTitle}>Основная информация</h3>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Номер студ. билета *</label>
              <input
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                style={styles.input}
                required
                disabled={isEditMode}
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Имя *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Фамилия *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Телефон</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={styles.input}
                placeholder="+79161234567"
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Дата рождения *</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Пол *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>
            
            {/* Учебная информация */}
            <h3 style={styles.sectionTitle}>Учебная информация</h3>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Факультет *</label>
              <input
                type="text"
                name="faculty"
                value={formData.faculty}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Группа *</label>
              <input
                type="text"
                name="group"
                value={formData.group}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Год поступления *</label>
              <input
                type="number"
                name="enrollment_year"
                value={formData.enrollment_year}
                onChange={handleChange}
                style={styles.input}
                min="2000"
                max="2100"
                required
              />
            </div>
          </div>
          
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={styles.cancelBtn}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Сохранение...' : isEditMode ? 'Обновить данные' : 'Создать студента'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Стили остаются такими же
const styles = {
  container: { padding: '20px', display: 'flex', justifyContent: 'center' },
  formContainer: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '30px', width: '100%', maxWidth: '800px' },
  title: { color: '#333', marginBottom: '30px', textAlign: 'center' },
  error: { backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '20px' },
  success: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '4px', marginBottom: '20px' },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' },
  sectionTitle: { gridColumn: '1 / -1', color: '#1976d2', margin: '20px 0 10px', paddingBottom: '10px', borderBottom: '2px solid #e0e0e0' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontWeight: '500', color: '#555' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' },
  select: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', backgroundColor: 'white' },
  buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' },
  submitBtn: { padding: '10px 30px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }
};

export default StudentForm;