import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import AppRoutes from './routes';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div style={{ padding: '20px' }}>
          <AppRoutes />
        </div>
        
        <footer style={styles.footer}>
          <p>Student Journal API • Лабораторная работа №2</p>
          <p style={styles.footerSubtitle}>
            React фронтенд для взаимодействия с REST API
          </p>
        </footer>
      </div>
    </Router>
  );
}

const styles = {
  footer: {
    backgroundColor: '#333',
    color: 'white',
    padding: '20px',
    textAlign: 'center',
    marginTop: '40px'
  },
  footerSubtitle: {
    fontSize: '14px',
    color: '#aaa',
    marginTop: '5px'
  }
};

export default App;