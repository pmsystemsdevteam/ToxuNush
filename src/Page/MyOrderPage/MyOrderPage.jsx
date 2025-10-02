import React, { useState, useEffect } from 'react';
import './MyOrderPage.scss';

function MyOrderPage() {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTable, setCurrentTable] = useState(null);
  const [latestOrder, setLatestOrder] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);

  // Status tərcümələri
  const statusTranslations = {
    empty: "Boş",
    reserved: "Rezerv",
    waitingFood: "Yemək gözləyir",
    waitingWaiter: "Ofisiant gözləyir",
    waitingBill: "Hesab gözləyir",
    sendOrder: "Sifariş göndərildi",
    sendKitchen: "Yemək mətbəxə göndərildi",
    makeFood: "Yemək hazırlanır",
    deliveredFood: "Yemək təhvil verildi"
  };

  useEffect(() => {
    // LocalStorage-dan məlumatları oxu
    const tableNumber = localStorage.getItem('table');
    setCurrentTable(tableNumber ? parseInt(tableNumber) : null);

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Masalar məlumatını al
        const tablesResponse = await fetch('http://172.20.5.167:8001/api/tables/');
        if (!tablesResponse.ok) {
          throw new Error('Masalar API cavab vermədi');
        }
        const tablesData = await tablesResponse.json();
        setTables(tablesData);
        
        // Sifariş məlumatlarını al
        const ordersResponse = await fetch('http://172.20.5.167:8001/api/baskets/');
        if (!ordersResponse.ok) {
          throw new Error('Sifarişlər API cavab vermədi');
        }
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
        
        // Cari masa üçün məlumatları təyin et
        if (tableNumber) {
          const tableNum = parseInt(tableNumber);
          
          // Masalar arasında cari masanı tap
          const currentTableInfo = tablesData.find(table => table.table_num === tableNum);
          setTableInfo(currentTableInfo);
          
          // Cari masa üçün sifarişləri filtrlə və ən son sifarişi tap
          const tableOrders = ordersData.filter(order => 
            order.table && order.table.table_num === tableNum
          );
          
          if (tableOrders.length > 0) {
            // Tarixə görə sırala (ən yeni üstə)
            tableOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setLatestOrder(tableOrders[0]);
          }
        }
      } catch (err) {
        setError(err.message);
        console.error('Xəta baş verdi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleNewOrder = () => {
    // Burada yeni sifariş səhifəsinə yönləndirmə edə bilərsiniz
    alert('Yeni sifariş verilməsi üçün səhifəyə yönləndirilirsiniz...');
    // window.location.href = '/new-order'; // Yönləndirmə üçün
  };

  if (loading) {
    return (
      <div className="my-order-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Yüklənir...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-order-page">
        <div className="error">
          <h3>Xəta baş verdi</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-order-page">
      <div className="order-header">
        <div className="header-content">
          <h1>Masa Məlumatları</h1>
          {currentTable && tableInfo && (
            <div className="table-info">
              <span className="table-number">Masa {currentTable}</span>
              <span className="chair-count">{tableInfo.chair_number} nəfərlik</span>
            
            </div>
          )}
        </div>
      </div>

      <div className="order-content">
        {!currentTable ? (
          <div className="no-table-info">
            <div className="icon">🍽️</div>
            <h3>Masa məlumatı tapılmadı</h3>
            <p>Zəhmət olmasa masa nömrəsini daxil edin.</p>
          </div>
        ) : !tableInfo ? (
          <div className="no-table-info">
            <div className="icon">❓</div>
            <h3>Masa tapılmadı</h3>
            <p>Masa {currentTable} üçün məlumat tapılmadı.</p>
          </div>
        ) : (
          <>
            {latestOrder ? (
              <div className="latest-order">
                <div className="order-card">
                  <div className="order-header-info">
                    <div className="order-id">Sifariş №{latestOrder.id}</div>
                    <div className="order-date">
                      {new Date(latestOrder.created_at).toLocaleString('az-AZ')}
                    </div>
                    <div className={`status status-${latestOrder.table.status}`}>
                      {statusTranslations[latestOrder.table.status] || latestOrder.table.status}
                    </div>
                  </div>


                  {latestOrder.items && latestOrder.items.length > 0 ? (
                    <>
                      <div className="order-items">
                        <h3>Sifariş edilənlər:</h3>
                        {latestOrder.items.map(item => (
                          <div key={item.id} className="order-item">
                            <div className="item-info">
                              <span className="item-name">{item.name_az}</span>
                              <span className="item-quantity">x {item.count}</span>
                            </div>
                            <div className="item-details">
                              <span className="item-description">{item.description_az}</span>
                              <span className="item-price">{item.cost} AZN</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="order-summary">
                        <div className="summary-row">
                          <span>Xidmət haqqı:</span>
                          <span>{latestOrder.service_cost} AZN</span>
                        </div>
                        <div className="summary-row total">
                          <span>Ümumi məbləğ:</span>
                          <span>{latestOrder.total_cost} AZN</span>
                        </div>
                        <div className="summary-row">
                          <span>Hazırlanma vaxtı:</span>
                          <span>{latestOrder.total_time} dəqiqə</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="no-items">Sifarişdə heç bir məhsul yoxdur.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-orders">
                <div className="icon">📝</div>
                <h3>Heç bir sifariş tapılmadı</h3>
                <p>Masa {currentTable} üçün heç bir sifariş yoxdur.</p>
              </div>
            )}

            <div className="order-actions">
              <button className="order-button primary" onClick={handleNewOrder}>
                <span className="icon">+</span>
                Əlavə yemək sifariş ver
              </button>
              
              <button className="order-button secondary">
                Ofisiant çağır
              </button>

              <button className="order-button secondary">
                Hesab tələb et
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MyOrderPage;