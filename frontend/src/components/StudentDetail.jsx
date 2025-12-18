import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { studentAPI, gradeAPI } from '../services/api';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [average, setAverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradeDialog, setGradeDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  
  const [newGrade, setNewGrade] = useState({
    subject: '',
    grade: 5,
    teacher: '',
    semester: 1
  });

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  // Загрузка всех данных студента
  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Параллельная загрузка всех данных
      const [studentRes, gradesRes, averageRes, statsRes] = await Promise.allSettled([
        studentAPI.getById(id),
        gradeAPI.getByStudent(id),
        gradeAPI.getAverage(id),
        studentAPI.getStats(id)
      ]);
      
      // Обработка результатов
      setStudent(studentRes.status === 'fulfilled' ? studentRes.value.data : null);
      setGrades(gradesRes.status === 'fulfilled' ? gradesRes.value.data : []);
      setAverage(averageRes.status === 'fulfilled' ? averageRes.value.data : null);
      setStats(statsRes.status === 'fulfilled' ? statsRes.value.data : null);
      
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  };

  // Добавление новой оценки
  const handleAddGrade = async () => {
    try {
      await gradeAPI.create({
        ...newGrade,
        student_id: parseInt(id)
      });
      
      setGradeDialog(false);
      setNewGrade({
        subject: '',
        grade: 5,
        teacher: '',
        semester: 1
      });
      
      // Обновляем данные
      fetchStudentData();
    } catch (err) {
      console.error('Ошибка добавления оценки:', err);
      alert('Не удалось добавить оценку');
    }
  };

  // Удаление оценки
  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту оценку?')) {
      return;
    }
    
    try {
      await gradeAPI.delete(gradeId);
      fetchStudentData();
    } catch (err) {
      console.error('Ошибка удаления оценки:', err);
      alert('Не удалось удалить оценку');
    }
  };

  // Удаление студента
  const handleDeleteStudent = async () => {
    try {
      await studentAPI.delete(id);
      setDeleteDialog(false);
      navigate('/');
    } catch (err) {
      console.error('Ошибка удаления студента:', err);
      alert('Не удалось удалить студента');
    }
  };

  // Функция для получения цвета оценки
  const getGradeColor = (grade) => {
    switch(grade) {
      case 5: return '#4caf50';
      case 4: return '#2196f3';
      case 3: return '#ff9800';
      case 2: return '#f44336';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Загрузка данных студента...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={styles.errorContainer}>
        <h2>Студент не найден</h2>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          Вернуться к списку
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Кнопки навигации */}
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>
          ← Назад к списку
        </button>
        <div style={styles.actions}>
          <Link to={`/students/${id}/edit`} style={styles.editBtn}>
            ✏️ Редактировать
          </Link>
          <button 
            onClick={() => setDeleteDialog(true)} 
            style={styles.deleteBtn}
          >
            🗑️ Удалить
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Информация о студенте */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Информация о студенте</h2>
            
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <strong>ФИО:</strong>
                <span>{student.first_name} {student.last_name}</span>
              </div>
              
              <div style={styles.infoItem}>
                <strong>Email:</strong>
                <span>{student.email}</span>
              </div>
              
              {student.phone && (
                <div style={styles.infoItem}>
                  <strong>Телефон:</strong>
                  <span>{student.phone}</span>
                </div>
              )}
              
              <div style={styles.infoItem}>
                <strong>Факультет:</strong>
                <span>{student.faculty}</span>
              </div>
              
              <div style={styles.infoItem}>
                <strong>Группа:</strong>
                <span>{student.group}</span>
              </div>
              
              <div style={styles.infoItem}>
                <strong>Год поступления:</strong>
                <span>{student.enrollment_year}</span>
              </div>
              
              <div style={styles.infoItem}>
                <strong>Пол:</strong>
                <span>{student.gender === 'male' ? 'Мужской' : 'Женский'}</span>
              </div>
              
              <div style={styles.infoItem}>
                <strong>Дата рождения:</strong>
                <span>{new Date(student.date_of_birth).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Статистика */}
          {stats && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Статистика</h2>
              
              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <div style={styles.statValue}>
                    {average?.average_grade ? average.average_grade.toFixed(2) : '0.00'}
                  </div>
                  <div style={styles.statLabel}>Средний балл</div>
                </div>
                
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{stats.total_grades || 0}</div>
                  <div style={styles.statLabel}>Всего оценок</div>
                </div>
                
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{stats.excellent_grades || 0}</div>
                  <div style={styles.statLabel}>Отлично (5)</div>
                </div>
                
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{stats.good_grades || 0}</div>
                  <div style={styles.statLabel}>Хорошо (4)</div>
                </div>
                
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{stats.satisfactory_grades || 0}</div>
                  <div style={styles.statLabel}>Удовл. (3)</div>
                </div>
                
                <div style={styles.statItem}>
                  <div style={styles.statValue}>{stats.unsatisfactory_grades || 0}</div>
                  <div style={styles.statLabel}>Неуд. (2)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Оценки */}
        <div style={styles.rightColumn}>
          <div style={styles.card}>
            <div style={styles.gradesHeader}>
              <h2 style={styles.cardTitle}>Оценки</h2>
              <button 
                onClick={() => setGradeDialog(true)} 
                style={styles.addGradeBtn}
              >
                + Добавить оценку
              </button>
            </div>
            
            {grades.length === 0 ? (
              <div style={styles.noGrades}>
                <p>У студента пока нет оценок</p>
                <button 
                  onClick={() => setGradeDialog(true)} 
                  style={styles.addFirstGradeBtn}
                >
                  Добавить первую оценку
                </button>
              </div>
            ) : (
              <table style={styles.gradesTable}>
                <thead>
                  <tr>
                    <th style={styles.th}>Предмет</th>
                    <th style={styles.th}>Оценка</th>
                    <th style={styles.th}>Преподаватель</th>
                    <th style={styles.th}>Семестр</th>
                    <th style={styles.th}>Дата</th>
                    <th style={styles.th}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade.id} style={styles.tr}>
                      <td style={styles.td}>{grade.subject}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.gradeBadge,
                          backgroundColor: getGradeColor(grade.grade)
                        }}>
                          {grade.grade}
                        </span>
                      </td>
                      <td style={styles.td}>{grade.teacher || '-'}</td>
                      <td style={styles.td}>{grade.semester}</td>
                      <td style={styles.td}>
                        {new Date(grade.date).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleDeleteGrade(grade.id)}
                          style={styles.deleteGradeBtn}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Диалог добавления оценки */}
      {gradeDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>Добавить оценку</h3>
            
            <div style={styles.dialogContent}>
              <div style={styles.dialogInputGroup}>
                <label style={styles.dialogLabel}>Предмет *</label>
                <input
                  type="text"
                  value={newGrade.subject}
                  onChange={(e) => setNewGrade({...newGrade, subject: e.target.value})}
                  style={styles.dialogInput}
                />
              </div>
              
              <div style={styles.dialogInputGroup}>
                <label style={styles.dialogLabel}>Оценка *</label>
                <select
                  value={newGrade.grade}
                  onChange={(e) => setNewGrade({...newGrade, grade: parseInt(e.target.value)})}
                  style={styles.dialogSelect}
                >
                  {[5, 4, 3, 2].map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              
              <div style={styles.dialogInputGroup}>
                <label style={styles.dialogLabel}>Преподаватель</label>
                <input
                  type="text"
                  value={newGrade.teacher}
                  onChange={(e) => setNewGrade({...newGrade, teacher: e.target.value})}
                  style={styles.dialogInput}
                />
              </div>
              
              <div style={styles.dialogInputGroup}>
                <label style={styles.dialogLabel}>Семестр *</label>
                <select
                  value={newGrade.semester}
                  onChange={(e) => setNewGrade({...newGrade, semester: parseInt(e.target.value)})}
                  style={styles.dialogSelect}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={styles.dialogActions}>
              <button 
                onClick={() => setGradeDialog(false)} 
                style={styles.dialogCancelBtn}
              >
                Отмена
              </button>
              <button 
                onClick={handleAddGrade} 
                style={styles.dialogSubmitBtn}
                disabled={!newGrade.subject.trim()}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Диалог удаления студента */}
      {deleteDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <h3 style={styles.dialogTitle}>Удаление студента</h3>
            
            <div style={styles.dialogContent}>
              <p>Вы уверены, что хотите удалить студента {student.first_name} {student.last_name}?</p>
              <p style={styles.warning}>Все оценки студента также будут удалены!</p>
            </div>
            
            <div style={styles.dialogActions}>
              <button 
                onClick={() => setDeleteDialog(false)} 
                style={styles.dialogCancelBtn}
              >
                Отмена
              </button>
              <button 
                onClick={handleDeleteStudent} 
                style={styles.dialogDeleteBtn}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Стили остаются такими же, добавьте только новые для диалогов
const styles = {
  // ... существующие стили
  dialogOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  dialogTitle: {
    marginBottom: '20px',
    color: '#333'
  },
  dialogContent: {
    marginBottom: '30px'
  },
  dialogInputGroup: {
    marginBottom: '15px'
  },
  dialogLabel: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '500'
  },
  dialogInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  dialogSelect: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white'
  },
  dialogActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  dialogCancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  dialogSubmitBtn: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  dialogDeleteBtn: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  warning: {
    color: '#f44336',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  noGrades: {
    textAlign: 'center',
    padding: '40px'
  },
  addFirstGradeBtn: {
    padding: '10px 20px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px'
  }
};

export default StudentDetail;