import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../services/api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    faculty: '',
    group: '',
    enrollment_year: ''
  });

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  // Функция для загрузки студентов с API
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll(filters);
      setStudents(response.data.items || response.data || []);
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке студентов:', err);
      setError('Не удалось загрузить список студентов');
      // Временно используем моковые данные при ошибке
      setStudents(getMockStudents());
    } finally {
      setLoading(false);
    }
  };

  // Функция поиска студентов
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchStudents();
      return;
    }
    
    try {
      setLoading(true);
      const response = await studentAPI.search(searchTerm);
      setStudents(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Ошибка при поиске:', err);
      setError('Ошибка при поиске студентов');
    } finally {
      setLoading(false);
    }
  };

  // Функция удаления студента
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого студента?')) {
      return;
    }
    
    try {
      await studentAPI.delete(id);
      // Обновляем список после удаления
      fetchStudents();
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      alert('Не удалось удалить студента');
    }
  };

  // Резервные моковые данные (используются только при ошибке API)
  const getMockStudents = () => {
    return [
      {
        id: 1,
        student_id: 'ST001',
        first_name: 'Иван',
        last_name: 'Иванов',
        email: 'ivan@example.com',
        faculty: 'Информатика',
        group: 'ИС-101',
        enrollment_year: 2020,
        average_grade: 4.5
      },
      {
        id: 2,
        student_id: 'ST002',
        first_name: 'Мария',
        last_name: 'Петрова',
        email: 'maria@example.com',
        faculty: 'Информатика',
        group: 'ИС-101',
        enrollment_year: 2020,
        average_grade: 4.2
      }
    ];
  };

  // Функция для получения цвета в зависимости от оценки
  const getGradeColor = (grade) => {
    if (!grade) return '#757575';
    if (grade >= 4.5) return '#4caf50';
    if (grade >= 4) return '#2196f3';
    if (grade >= 3.5) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Загрузка студентов...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Список студентов</h1>
      
      {/* Панель поиска и фильтров */}
      <div style={styles.filterPanel}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Поиск по имени, фамилии, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} style={styles.searchButton}>
            🔍
          </button>
        </div>
        
        <div style={styles.filters}>
          <input
            type="text"
            placeholder="Факультет"
            value={filters.faculty}
            onChange={(e) => setFilters({...filters, faculty: e.target.value})}
            style={styles.filterInput}
          />
          <input
            type="text"
            placeholder="Группа"
            value={filters.group}
            onChange={(e) => setFilters({...filters, group: e.target.value})}
            style={styles.filterInput}
          />
          <input
            type="number"
            placeholder="Год поступления"
            value={filters.enrollment_year}
            onChange={(e) => setFilters({...filters, enrollment_year: e.target.value})}
            style={styles.filterInput}
          />
          <button 
            onClick={() => setFilters({ faculty: '', group: '', enrollment_year: '' })}
            style={styles.resetButton}
          >
            Сбросить
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
          <button onClick={fetchStudents} style={styles.retryButton}>
            Повторить
          </button>
        </div>
      )}

      {/* Таблица студентов */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ФИО</th>
              <th style={styles.th}>№ студ. билета</th>
              <th style={styles.th}>Факультет</th>
              <th style={styles.th}>Группа</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Средний балл</th>
              <th style={styles.th}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" style={styles.noData}>
                  {searchTerm || Object.values(filters).some(f => f) 
                    ? 'Студенты не найдены' 
                    : 'Нет данных о студентах'}
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} style={styles.tr}>
                  <td style={styles.td}>
                    <Link to={`/students/${student.id}`} style={styles.link}>
                      {student.last_name} {student.first_name}
                    </Link>
                  </td>
                  <td style={styles.td}>{student.student_id}</td>
                  <td style={styles.td}>{student.faculty}</td>
                  <td style={styles.td}>{student.group}</td>
                  <td style={styles.td}>{student.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.gradeBadge,
                      backgroundColor: getGradeColor(student.average_grade)
                    }}>
                      {student.average_grade || 'Нет'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <Link to={`/students/${student.id}`} style={styles.viewBtn}>
                        👁️
                      </Link>
                      <Link to={`/students/${student.id}/edit`} style={styles.editBtn}>
                        ✏️
                      </Link>
                      <button 
                        onClick={() => handleDelete(student.id)} 
                        style={styles.deleteBtn}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Стили остаются такими же как в предыдущей версии
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    color: '#333',
    marginBottom: '20px'
  },
  filterPanel: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px'
  },
  searchBox: {
    display: 'flex',
    marginBottom: '15px'
  },
  searchInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px 0 0 4px',
    fontSize: '16px'
  },
  searchButton: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '0 4px 4px 0',
    cursor: 'pointer',
    fontSize: '16px'
  },
  filters: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    width: '150px'
  },
  resetButton: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  retryButton: {
    padding: '5px 15px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #1976d2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px'
  },
  // ... остальные стили такие же как раньше
};

// Добавьте анимацию спиннера в CSS
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default StudentList;