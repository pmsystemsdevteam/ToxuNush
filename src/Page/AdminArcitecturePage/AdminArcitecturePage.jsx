import React, { useState, useEffect } from 'react';
import './AdminArcitecturePage.scss';

function AdminArcitecturePage() {
  // Initial state for architecture data
  const [architectureData, setArchitectureData] = useState({
    monthlyRevenue: 45000,
    employeeCount: 25,
    tableCount: 35,
    orders: {
      daily: 240,
      weekly: 1680,
      monthly: 7200
    }
  });

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [timeFrame, setTimeFrame] = useState('monthly');
  const [revenueData, setRevenueData] = useState([]);

  // Generate sample revenue data
  useEffect(() => {
    const generateRevenueData = () => {
      const data = [];
      const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
      
      for (let i = 0; i < 12; i++) {
        data.push({
          month: months[i],
          revenue: Math.floor(Math.random() * 10000) + 35000
        });
      }
      
      return data;
    };

    setRevenueData(generateRevenueData());
  }, []);

  // Handle editing a field
  const startEditing = (field, value) => {
    setEditingField(field);
    setTempValue(value);
  };

  // Save the edited value
  const saveEdit = () => {
    if (editingField) {
      if (editingField.includes('orders.')) {
        const orderType = editingField.split('.')[1];
        setArchitectureData({
          ...architectureData,
          orders: {
            ...architectureData.orders,
            [orderType]: parseInt(tempValue) || 0
          }
        });
      } else {
        setArchitectureData({
          ...architectureData,
          [editingField]: parseInt(tempValue) || 0
        });
      }
      
      setEditingField(null);
      setTempValue('');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setTempValue(e.target.value);
  };

  // Handle key press for input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // Calculate revenue change percentage
  const calculateRevenueChange = () => {
    if (revenueData.length < 2) return 0;
    
    const current = revenueData[revenueData.length - 1].revenue;
    const previous = revenueData[revenueData.length - 2].revenue;
    
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Render the revenue chart
  const renderRevenueChart = () => {
    const maxRevenue = Math.max(...revenueData.map(item => item.revenue));
    
    return (
      <div className="revenue-chart">
        {revenueData.map((item, index) => (
          <div key={index} className="chart-bar-container">
            <div className="chart-bar">
              <div 
                className="chart-fill" 
                style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}
              ></div>
            </div>
            <span className="chart-label">{item.month}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-architecture-page">
      <div className="page-header">
        <h1>Restoran Arxitektura & Analitika</h1>
        <p>İş performansı və infrastruktur göstəriciləri</p>
      </div>

      <div className="timeframe-selector">
        <button 
          className={timeFrame === 'daily' ? 'active' : ''}
          onClick={() => setTimeFrame('daily')}
        >
          Günlük
        </button>
        <button 
          className={timeFrame === 'weekly' ? 'active' : ''}
          onClick={() => setTimeFrame('weekly')}
        >
          Həftəlik
        </button>
        <button 
          className={timeFrame === 'monthly' ? 'active' : ''}
          onClick={() => setTimeFrame('monthly')}
        >
          Aylıq
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-header">
            <h3>Aylıq Gəlir</h3>
            <button 
              className="edit-btn"
              onClick={() => startEditing('monthlyRevenue', architectureData.monthlyRevenue)}
            >
              <i className="fas fa-edit"></i>
            </button>
          </div>
          <div className="metric-value">
            {editingField === 'monthlyRevenue' ? (
              <input
                type="number"
                value={tempValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                autoFocus
              />
            ) : (
              <span>{architectureData.monthlyRevenue.toLocaleString()} AZN</span>
            )}
            <span className="change-percentage positive">+{calculateRevenueChange()}%</span>
          </div>
          <div className="metric-footer">
            <span>Ötən ayla müqayisədə</span>
          </div>
        </div>

        <div className="metric-card employees">
          <div className="metric-header">
            <h3>İşçi Sayı</h3>
            <button 
              className="edit-btn"
              onClick={() => startEditing('employeeCount', architectureData.employeeCount)}
            >
              <i className="fas fa-edit"></i>
            </button>
          </div>
          <div className="metric-value">
            {editingField === 'employeeCount' ? (
              <input
                type="number"
                value={tempValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                autoFocus
              />
            ) : (
              <span>{architectureData.employeeCount}</span>
            )}
          </div>
          <div className="metric-footer">
            <span>Ümumi işçi sayı</span>
          </div>
        </div>

        <div className="metric-card tables">
          <div className="metric-header">
            <h3>Masa Sayı</h3>
            <button 
              className="edit-btn"
              onClick={() => startEditing('tableCount', architectureData.tableCount)}
            >
              <i className="fas fa-edit"></i>
            </button>
          </div>
          <div className="metric-value">
            {editingField === 'tableCount' ? (
              <input
                type="number"
                value={tempValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                autoFocus
              />
            ) : (
              <span>{architectureData.tableCount}</span>
            )}
          </div>
          <div className="metric-footer">
            <span>Ümumi masa sayı</span>
          </div>
        </div>

        <div className="metric-card orders">
          <div className="metric-header">
            <h3>Sifariş Sayı</h3>
            <button 
              className="edit-btn"
              onClick={() => startEditing(`orders.${timeFrame}`, architectureData.orders[timeFrame])}
            >
              <i className="fas fa-edit"></i>
            </button>
          </div>
          <div className="metric-value">
            {editingField === `orders.${timeFrame}` ? (
              <input
                type="number"
                value={tempValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                autoFocus
              />
            ) : (
              <span>{architectureData.orders[timeFrame].toLocaleString()}</span>
            )}
          </div>
          <div className="metric-footer">
            <span>{timeFrame === 'daily' ? 'Günlük' : timeFrame === 'weekly' ? 'Həftəlik' : 'Aylıq'} sifariş sayı</span>
          </div>
        </div>
      </div>

      {editingField && (
        <div className="edit-actions">
          <button className="save-btn" onClick={saveEdit}>Yadda Saxla</button>
          <button className="cancel-btn" onClick={cancelEdit}>Ləğv Et</button>
        </div>
      )}

      <div className="charts-section">
        <div className="chart-card">
          <h3>Gəlir Trendi (Son 12 ay)</h3>
          <div className="chart-container">
            {renderRevenueChart()}
          </div>
        </div>

        <div className="data-card">
          <h3>Məlumat Analitikası</h3>
          <div className="data-grid">
            <div className="data-item">
              <span className="data-label">Orta Masa Doluluk:</span>
              <span className="data-value">78%</span>
            </div>
            <div className="data-item">
              <span className="data-label">İşçi Başına Sifariş:</span>
              <span className="data-value">{(architectureData.orders.daily / architectureData.employeeCount).toFixed(1)}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Masa Başına Gəlir:</span>
              <span className="data-value">{(architectureData.monthlyRevenue / architectureData.tableCount).toLocaleString()} AZN</span>
            </div>
            <div className="data-item">
              <span className="data-label">Sifarişin Orta Dəyəri:</span>
              <span className="data-value">{(architectureData.monthlyRevenue / architectureData.orders.monthly).toFixed(2)} AZN</span>
            </div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <h2>Hesabatlar</h2>
        <div className="report-cards">
          <div className="report-card">
            <i className="fas fa-file-alt"></i>
            <h4>Günlük Hesabat</h4>
            <p>Gündəlik satış və sifariş məlumatları</p>
            <button className="download-btn">Yüklə</button>
          </div>
          <div className="report-card">
            <i className="fas fa-chart-line"></i>
            <h4>Həftəlik Hesabat</h4>
            <p>Həftəlik performans və trend analitikası</p>
            <button className="download-btn">Yüklə</button>
          </div>
          <div className="report-card">
            <i className="fas fa-chart-pie"></i>
            <h4>Aylıq Hesabat</h4>
            <p>Aylıq maliyyə və əməliyyat hesabatı</p>
            <button className="download-btn">Yüklə</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminArcitecturePage;