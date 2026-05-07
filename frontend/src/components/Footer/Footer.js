import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/footerLogo4.png" alt="ASK KRISHNA Logo" className="footer-logo-img" />
            <span className="footer-logo-text">ASK KRISHNA</span>
          </div>
          <p className="footer-description">
            Your guide to the wisdom of Bhagavad Gita
          </p>
        </div>
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {currentYear} ASK KRISHNA. All rights reserved.
            Created by <span className="creator-highlight">Shivam Chamoli</span>.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;