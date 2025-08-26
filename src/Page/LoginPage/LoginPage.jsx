import React, { useState } from 'react';
import './LoginPage.scss';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Burada giriş məntiqi əlavə ediləcək
    console.log('Username:', username);
    console.log('Password:', password);
    alert('Giriş uğurla tamamlandı!');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <i className="fas fa-user-circle"></i>
          <h2>Admin Panelə Daxil Olun</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">İstifadəçi Adı</label>
            <div className="input-with-icon">
              <i className="fas fa-user"></i>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="İstifadəçi adınızı daxil edin"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Parol</label>
            <div className="input-with-icon">
              <i className="fas fa-lock"></i>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolunuzu daxil edin"
                required
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Parolu gizlət" : "Parolu göstər"}
              >
                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
              </button>
            </div>
          </div>


          <button type="submit" className="login-button">Daxil Ol</button>
        </form>

    
      </div>
    </div>
  );
}

export default LoginPage;