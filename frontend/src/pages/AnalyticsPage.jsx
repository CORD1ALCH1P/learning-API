import React, { useState, useEffect } from 'react';
import { gradeAPI, studentAPI } from '../services/api';

const AnalyticsPage = () => {
  const [faculty, setFaculty] = useState('Информатика');
  const [semester, setSemester] = useState('');
  const [performanceData, setPerformanceData] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [facultyStats, setFacultyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [faculty, semester]);

  // Загрузка аналитики с API
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем данные параллельно
      const [performanceRes, topStudentsRes, facultyStatsRes] = await Promise.allSettled([
        gradeAPI.getSubjectsPerformance(semester || null),
        gradeAPI.getTopStudents(faculty, 10),
        studentAPI.getFacultyStats(faculty)
      ]);
      
      // Обработка результатов
      if (performanceRes.status === 'fulfilled') {
        setPerformanceData(performanceRes.value.data.subjects_performance || []);
      } else {
        console.error('Ошибка загрузки успеваемости:', performanceRes.reason);
        setPerformanceData(getMockPerformance());
      }
      
      if (topStudentsRes.status === 'fulfilled') {
        setTopStudents(topStudentsRes.value.data.top_students || []);
      } else {
        console.error('Ошибка загрузки топ студентов:', topStudentsRes.reason);
        setTopStudents(getMockTopStudents());
      }
      
      if (facultyStatsRes.status === 'fulfilled') {
        setFacultyStats(facultyStatsRes.value.data);
      } else {
        console.error('Ошибка загрузки статистики факультета:', facultyStatsRes.reason);
        setFacultyStats(null);
      }
      
    } catch (err) {
      console.error('Ошибка загрузки аналитики:', err);
      setError('Не удалось загрузить данные аналитики');
      // Используем моковые данные при ошибке
      setPerformanceData(getMockPerformance());
      setTopStudents(getMockTopStudents());
    } finally {
      setLoading(false);
    }
  };

  // Резервные моковые данные
  const getMockPerformance = () => [
    { subject: 'Математика', average_grade: 4.2, total_grades: 45, success_rate: 85 },
    { subject: 'Программирование', average_grade: 4.5, total_grades: 38, success_rate: 92 },
    { subject: 'Физика', average_grade: 3.8, total_grades: 42, success_rate: 76 },
    { subject: 'Базы данных', average_grade: 4.3, total_grades: 35, success_rate: 88 },
    { subject: 'Алгоритмы', average_grade: 4.1, total_grades: 40, success_rate: 82 }
  ];

  const getMockTopStudents = () => [
    { id: 1, full_name: 'Иван Иванов', group: 'ИС-101', average_grade: 4.8, total_grades: 15 },
    { id: 2, full_name: 'Мария Петрова', group: 'ИС-101', average_grade: 4.6, total_grades: 14 },
    { id: 3, full_name: 'Алексей Сидоров', group: 'ИС-102', average_grade: 4.4, total_grades: 16 }
  ];

  // Функции для цветов
  const getChartColor = (grade) => {
    if (grade >= 4.5) return '#4caf50';
    if (grade >= 4) return '#2196f3';
    if (grade >= 3.5) return '#ff9800';
    return '#f44336';
  };

  const getPlaceColor = (place) => {
    if (place === 1) return '#ffd700';
    if (place === 2) return '#c0c0c0';
    if (place === 3) return '#cd7f32';
    return '#f5f5f5';
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Загрузка аналитики...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Аналитика успеваемости</h1>

      {/* Фильтры */}
      <div style={styles.filtersCard}>
        <h2 style={styles.sectionTitle}>Фильтры</h2>
        <div style={styles.filters}>
          <div style={styles.filterGroup}>
            <label style={styles.label}>Факультет:</label>
            <input
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              style={styles.input}
              placeholder="Введите факультет"
            />
          </div>
          
          <div style={styles.filterGroup}>
            <label style={styles.label}>Семестр:</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              style={styles.select}
            >
              <option value="">Все семестры</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>{sem} семестр</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={fetchAnalytics} 
            style={styles.refreshButton}
          >
            🔄 Обновить
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
          <button onClick={fetchAnalytics} style={styles.retryButton}>
            Повторить
          </button>
        </div>
      )}

      <div style={styles.content}>
        {/* Статистика факультета */}
        {facultyStats && (
          <div style={styles.statsCard}>
            <h2 style={styles.cardTitle}>Статистика факультета "{faculty}"</h2>
            <div style={styles.facultyStats}>
              <div style={styles.facultyStat}>
                <div style={styles.facultyStatNumber}>
                  {facultyStats.total_students || 0}
                </div>
                <div style={styles.facultyStatLabel}>Студентов</div>
              </div>
              <div style={styles.facultyStat}>
                <div style={styles.facultyStatNumber}>
                  {facultyStats.average_grade ? facultyStats.average_grade.toFixed(2) : '0.00'}
                </div>
                <div style={styles.facultyStatLabel}>Средний балл</div>
              </div>
              {facultyStats.best_student && (
                <div style={styles.facultyStat}>
                  <div style={styles.facultyStatNumber}>🏆</div>
                  <div style={styles.facultyStatLabel}>
                    Лучший: {facultyStats.best_student}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Успеваемость по предметам */}
        <div style={styles.performanceCard}>
          <h2 style={styles.cardTitle}>
            Успеваемость по предметам {semester && `(${semester} семестр)`}
          </h2>
          
          <div style={styles.performanceList}>
            {performanceData.map((item, index) => (
              <div key={index} style={styles.performanceItem}>
                <div style={styles.performanceHeader}>
                  <h3 style={styles.subjectName}>{item.subject}</h3>
                  <span style={styles.subjectStats}>
                    {item.total_grades} оценок
                  </span>
                </div>
                
                <div style={styles.performanceBarContainer}>
                  <div 
                    style={{
                      ...styles.performanceBar,
                      width: `${item.success_rate}%`,
                      backgroundColor: getChartColor(item.average_grade)
                    }}
                  >
                    <span style={styles.performanceBarText}>
                      Средний балл: {item.average_grade.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div style={styles.performanceFooter}>
                  <span style={styles.successRate}>
                    Успеваемость: {item.success_rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Топ студентов */}
        <div style={styles.topStudentsCard}>
          <h2 style={styles.cardTitle}>Топ студентов факультета {faculty}</h2>
          
          <div style={styles.topStudentsList}>
            {topStudents.map((student, index) => (
              <div key={student.id} style={styles.topStudentItem}>
                <div style={styles.studentRank}>
                  <span style={{
                    ...styles.rankBadge,
                    backgroundColor: getPlaceColor(index + 1)
                  }}>
                    {index + 1}
                  </span>
                </div>
                
                <div style={styles.studentInfo}>
                  <div style={styles.studentName}>{student.full_name}</div>
                  <div style={styles.studentGroup}>Группа: {student.group}</div>
                </div>
                
                <div style={styles.studentStats}>
                  <div style={styles.studentAverage}>
                    {student.average_grade.toFixed(2)}
                  </div>
                  <div style={styles.studentGrades}>
                    {student.total_grades} оценок
                  </div>
                </div>
              </div>
            ))}
            
            {topStudents.length === 0 && (
              <div style={styles.noTopStudents}>
                Нет данных о студентах факультета "{faculty}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Стили
const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  title: { color: '#333', marginBottom: '30px', textAlign: 'center' },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' },
  spinner: { width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  error: { backgroundColor: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '4px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  retryButton: { padding: '5px 15px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  filtersCard: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '20px' },
  sectionTitle: { color: '#333', marginBottom: '20px' },
  filters: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: '500', color: '#555' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', width: '200px' },
  select: { padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px', width: '200px' },
  refreshButton: { padding: '10px 20px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', alignSelf: 'flex-end' },
  content: { display: 'flex', flexDirection: 'column', gap: '20px' },
  statsCard: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' },
  cardTitle: { color: '#333', marginBottom: '20px' },
  facultyStats: { display: 'flex', gap: '30px', justifyContent: 'space-around' },
  facultyStat: { textAlign: 'center' },
  facultyStatNumber: { fontSize: '36px', fontWeight: 'bold', color: '#1976d2', marginBottom: '5px' },
  facultyStatLabel: { fontSize: '14px', color: '#666' },
  performanceCard: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' },
  performanceList: { display: 'flex', flexDirection: 'column', gap: '20px' },
  performanceItem: { padding: '15px', border: '1px solid #eee', borderRadius: '6px' },
  performanceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  subjectName: { fontSize: '18px', fontWeight: '500', margin: 0 },
  subjectStats: { color: '#666', fontSize: '14px' },
  performanceBarContainer: { backgroundColor: '#f5f5f5', borderRadius: '10px', height: '30px', overflow: 'hidden', marginBottom: '10px' },
  performanceBar: { height: '100%', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px', transition: 'width 0.3s' },
  performanceBarText: { color: 'white', fontWeight: 'bold', fontSize: '14px', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' },
  performanceFooter: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' },
  successRate: { fontWeight: '500' },
  topStudentsCard: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' },
  topStudentsList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  topStudentItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '6px' },
  studentRank: { flexShrink: 0 },
  rankBadge: { display: 'inline-block', width: '40px', height: '40px', borderRadius: '50%', textAlign: 'center', lineHeight: '40px', fontWeight: 'bold', fontSize: '18px' },
  studentInfo: { flex: 1 },
  studentName: { fontWeight: '500', fontSize: '16px' },
  studentGroup: { color: '#666', fontSize: '14px', marginTop: '2px' },
  studentStats: { textAlign: 'center' },
  studentAverage: { fontSize: '24px', fontWeight: 'bold', color: '#1976d2' },
  studentGrades: { fontSize: '12px', color: '#666', marginTop: '2px' },
  noTopStudents: { textAlign: 'center', padding: '30px', color: '#666' }
};

export default AnalyticsPage;