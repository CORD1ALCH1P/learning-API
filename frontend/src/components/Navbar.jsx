import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <Link to="/" style={styles.logoLink}>Student Journal</Link>
        </div>
        <div style={styles.links}>
          <Link to="/" style={styles.link}>Студенты</Link>
          <Link to="/students/new" style={styles.link}>Добавить студента</Link>
          <Link to="/analytics" style={styles.link}>Аналитика</Link>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '16px 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  logoLink: {
    color: 'white',
    textDecoration: 'none'
  },
  links: {
    display: 'flex',
    gap: '20px'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    transition: 'background-color 0.3s'
  }
};

export default Navbar;