import React, { useState } from "react";
import "./Dashboard.scss";
import { Link, NavLink } from "react-router-dom";

function Dashboard() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activePage, setActivePage] = useState("Masalar");

  // Menyu səhifələri
  const menuItems = [
    {
      id: 1,
      name: "Masalar",
      icon: "fas fa-table",
      component: "Tables",
      path: "/admin",
    },
    {
      id: 2,
      name: "Məhsullar",
      icon: "fas fa-utensils",
      component: "Products",
      path: "/admin/product",
    },
    {
      id: 3,
      name: "Məhsul əlavə etmə",
      icon: "fas fa-plus-circle",
      component: "AddProduct",
      path: "/admin/product/add",
    },
    {
      id: 4,
      name: "Kataqoriyalar",
      icon: "fa-solid fa-burger",
      component: "Products",
      path: "/admin/category",
    },
    {
      id: 5,
      name: "Kataqoriya əlavə etmə",
      icon: "fa-solid fa-plus",
      component: "AddProduct",
      path: "/admin/category/add",
    },
    {
      id: 6,
      name: "Arxitektura",
      icon: "fas fa-layer-group",
      component: "Architecture",
      path: "/admin/architecture",
    },
  ];

  const handleMenuItemClick = (itemName) => {
    setActivePage(itemName);
  };

  return (
    <div className="dashboard">
      {/* Top Navigation */}
      <div className="top-nav">
        <div className="nav-left"></div>

        <div className="nav-right">
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">Admin İstifadəçi</span>
              <span className="user-role">Administrator</span>
            </div>
            <div className="user-avatar">
              <i className="fas fa-user-circle"></i>
            </div>
          </div>
        </div>
      </div>
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          {!isCollapsed && <h2>İdarəetmə Paneli</h2>}
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <NavLink to={`${item.path}`} className="link" >
              <li
                key={item.id}
                className={activePage === item.name ? "active" : ""}
                onClick={() => handleMenuItemClick(item.name)}
              >
                <i style={{ textAlign: "center" }} className={item.icon}></i>
                {isCollapsed && <div className="tooltip">{item.name}</div>}
              </li>
            </NavLink>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div className="collapse-toggle">
            <i
              style={{ textAlign: "center" }}
              className={`fas ${
                isCollapsed ? "fa-chevron-right" : "fa-chevron-left"
              }`}
            ></i>
            {!isCollapsed && <span>Gizlət</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
