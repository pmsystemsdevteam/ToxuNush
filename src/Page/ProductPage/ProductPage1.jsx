import React from "react";
import "./ProductPage1.scss";

// dekorasiya üçün şəkillər
import Left from "../../Image/HomeLeft.png";
import Right from "../../Image/HomeRight.png";
import { IoIosArrowRoundForward } from "react-icons/io";

const categories = [
  "Hamısı",
  "Əsas Yeməklər",
  "Salatlar",
  "Şorbalar",
  "Şirniyyatlar",
  "İçkilər",
  "İçkilər",
  "İçkilər",
  "İçkilər",
];

const products = [
  {
    id: 1,
    name: "Dolma",
    desc: "isti, ət",
    price: "8.00 AZN",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnrPHq7um_b7tNpwVrv4qMpnQL9TWFXhWNPA&s",
  },
  {
    id: 2,
    name: "Sezar salatı",
    desc: "tərəvəz, toyuq",
    price: "8.00 AZN",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnrPHq7um_b7tNpwVrv4qMpnQL9TWFXhWNPA&s",
  },
  {
    id: 3,
    name: "Mərci şorbası",
    desc: "vegan, isti",
    price: "4.00 AZN",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnrPHq7um_b7tNpwVrv4qMpnQL9TWFXhWNPA&s",
  },
  {
    id: 4,
    name: "Kabab",
    desc: "isti, ət",
    price: "15.00 AZN",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnrPHq7um_b7tNpwVrv4qMpnQL9TWFXhWNPA&s",
  },
  {
    id: 5,
    name: "Limonad",
    desc: "içki, sərin",
    price: "6.00 AZN",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnrPHq7um_b7tNpwVrv4qMpnQL9TWFXhWNPA&s",
  },
  {
    id: 6,
    name: "Türk paxlavası",
    desc: "desert, şirin",
    price: "6.00 AZN",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnrPHq7um_b7tNpwVrv4qMpnQL9TWFXhWNPA&s",
  },
  {
    id: 7,
    name: "Snikers tortu",
    desc: "desert, qozlu",
    price: "6.00 AZN",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnrPHq7um_b7tNpwVrv4qMpnQL9TWFXhWNPA&s",
  },
  {
    id: 8,
    name: "Çay",
    desc: "içki, isti",
    price: "4.00 AZN",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnrPHq7um_b7tNpwVrv4qMpnQL9TWFXhWNPA&s",
  },
];

function ProductPage1() {
  return (
    <div className="productPage1">
      {/* Dekorasiya şəkilləri */}
      <img src={Left} className="left" alt="left-decor" />
      <img src={Right} className="right" alt="right-decor" />

      <div className="product-page">
        <h2 className="title">Məhsullarımız</h2>
        <p className="subtitle">Ənənəvi ləzzətlərimizlə tanış olun</p>

        <div className="categories">
          {categories.map((cat, index) => (
            <div
              key={index}
              className={`category-btn ${index === 0 ? "active" : ""}`}
            >
              {cat}
            </div>
          ))}
        </div>

        <div className="products">
          {products.map((item) => (
            <div className="product-card" key={item.id}>
              <img src={item.image} alt={item.name} />
              <div className="info">
                <div className="text">
                  {" "}
                  <h3>{item.name}</h3>
                  <p>{item.desc}</p>
                </div>
                <span className="price">{item.price}</span>
              </div>
              <button className="add-btn">
                Səbətə əlavə et{" "}
                <div className="icon">
                  <IoIosArrowRoundForward />{" "}
                </div>
              </button>
            </div>
          ))}
        </div>
        <div className="more">Daha çox</div>
      </div>
    </div>
  );
}

export default ProductPage1;
