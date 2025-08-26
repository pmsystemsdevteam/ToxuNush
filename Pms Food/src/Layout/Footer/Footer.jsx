import React from 'react';
import './Footer.scss';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Lezzet</h3>
          <p>Ən dadlı yeməkləri sizə çatdırmaq üçün buradayıq. Hər kəsə özəl xüsusi ləzzətlər!</p>
          <div className="social-icons">
            <a href="#" aria-label="Facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" aria-label="YouTube">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
        </div>
        
        <div className="footer-section">
          <h4>Menyu</h4>
          <ul>
            <li><a href="#">Ana Səhifə</a></li>
            <li><a href="#">Məhsullar</a></li>
            <li><a href="#">Haqqımızda</a></li>
            <li><a href="#">Əlaqə</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>Əlaqə</h4>
          <ul className="contact-info">
            <li><i className="fas fa-map-marker-alt"></i> Baku, Azerbaijan</li>
            <li><i className="fas fa-phone"></i> +994 12 345 67 89</li>
            <li><i className="fas fa-envelope"></i> info@lezzet.az</li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4>İş Saatları</h4>
          <ul>
            <li>B.e - C.a: 09:00 - 23:00</li>
            <li>Şənbə: 10:00 - 00:00</li>
            <li>Bazar: 10:00 - 22:00</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2023 Lezzet. Bütün hüquqlar qorunur. Created by <span>PM Systems</span></p>
      </div>
    </footer>
  );
}

export default Footer;