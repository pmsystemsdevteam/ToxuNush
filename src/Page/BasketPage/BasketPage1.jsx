import React, { useEffect, useState } from "react";
import "./BasketPage1.scss";
import { FiShoppingBag } from "react-icons/fi";
import Left from "../../Image/BasketLeft.png";
import Right from "../../Image/BasketRight.png";
import { MdTableBar } from "react-icons/md";
import { IoCloseCircleOutline } from "react-icons/io5";
import {
  IoIosArrowBack,
  IoIosArrowForward,
  IoIosArrowRoundForward,
} from "react-icons/io";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { RiDeleteBin5Line } from "react-icons/ri";
import axios from "axios";

function BasketPage1() {
  const [isEmpty, setIsEmpty] = useState(false);
  const [basketProducts, setBasketProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    const myBasket = JSON.parse(localStorage.getItem("my_basket")) || [];

    axios
      .get("http://172.20.5.167:8001/api/products/")
      .then((res) => {
        setAllProducts(res.data);

        const basketData = res.data.filter((p) => myBasket.includes(p.id));
        setBasketProducts(basketData);

        setIsEmpty(basketData.length === 0);
      })
      .catch((err) => console.error(err));
  }, []);

  // Məhsul sayını artırmaq üçün funksiya (maksimum 50)
  const increaseQuantity = (productId) => {
    setBasketProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId && (product.quantity || 1) < 50
          ? { ...product, quantity: (product.quantity || 1) + 1 }
          : product
      )
    );
  };

  // Məhsul sayını azaltmaq üçün funksiya
  const decreaseQuantity = (productId) => {
    setBasketProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId && (product.quantity || 1) > 1
          ? { ...product, quantity: product.quantity - 1 }
          : product
      )
    );
  };

  // Məhsulu səbətdən silmək üçün funksiya
  const removeFromBasket = (productId) => {
    const updatedBasket = basketProducts.filter(
      (product) => product.id !== productId
    );
    setBasketProducts(updatedBasket);

    // LocalStorage-dan da sil
    const myBasket = JSON.parse(localStorage.getItem("my_basket")) || [];
    const updatedLocalBasket = myBasket.filter((id) => id !== productId);
    localStorage.setItem("my_basket", JSON.stringify(updatedLocalBasket));

    setIsEmpty(updatedBasket.length === 0);
  };

  const masa = localStorage.getItem("table_num");
  // Məhsulu səbətə əlavə etmək üçün funksiya
  const addToBasket = (product) => {
    const myBasket = JSON.parse(localStorage.getItem("my_basket")) || [];

    // Əgər məhsul artıq səbətdə yoxdursa əlavə et
    if (!myBasket.includes(product.id)) {
      const updatedBasket = [...myBasket, product.id];
      localStorage.setItem("my_basket", JSON.stringify(updatedBasket));

      // State-i yenilə
      setBasketProducts((prev) => [...prev, { ...product, quantity: 1 }]);
      setIsEmpty(false);
    }
  };

  // Ümumi məbləği hesablamaq
  const calculateTotal = () => {
    return basketProducts
      .reduce((total, product) => {
        return total + product.cost * (product.quantity || 1);
      }, 0)
      .toFixed(2);
  };

  // Müddətləri hesablamaq
  const calculateTotalTime = () => {
    // Məhsulları qruplaşdır (eyni məhsulları birləşdir)
    const productGroups = {};

    basketProducts.forEach((product) => {
      if (!productGroups[product.id]) {
        productGroups[product.id] = {
          ...product,
          totalQuantity: 0,
          totalTime: 0,
        };
      }
      productGroups[product.id].totalQuantity += product.quantity || 1;
    });

    // Hər bir qrup üçün müddəti hesabla
    let totalTime = 0;
    Object.values(productGroups).forEach((group) => {
      const baseTime = group.preparation_time || 10; // Default 10 dəqiqə

      if (group.totalQuantity === 1) {
        totalTime += baseTime;
      } else {
        // Eyni məhsuldan çox olduqda ortalama hesabla
        // İlk 2 ədəd üçün 1.5 qat, sonrakılar üçün xətti artım
        const averageTime = baseTime * (1 + (group.totalQuantity - 1) * 0.3);
        totalTime += averageTime;
      }
    });

    return Math.round(totalTime);
  };

  // Servis haqqını hesablamaq (ümumi məbləğin 10%-i)
  const calculateServiceFee = () => {
    const total = parseFloat(calculateTotal());
    return (total * 0.1).toFixed(2);
  };
  // const calculateServiceFee = () => {
  //   return "2.00";
  // };

  // Ümumi ödəniləcək məbləğ (məbləğ + servis haqqı)
  const calculateGrandTotal = () => {
    const total = parseFloat(calculateTotal());
    const serviceFee = parseFloat(calculateServiceFee());
    return (total + serviceFee).toFixed(2);
  };

  // Maksimum say limitini yoxlamaq
  const isMaxQuantity = (quantity) => {
    return (quantity || 1) >= 50;
  };

  // digər məhsullar üçün filter (basketdəki kateqoriyalar + əlavə digərləri)
  const otherProducts = allProducts.filter(
    (p) => !basketProducts.find((bp) => bp.id === p.id)
  );

  return (
    <div className="basket-page">
      <div className="frontPage">
        <img src={Left} className="left" alt="left-decor" />
        <img src={Right} className="right" alt="right-decor" />
      </div>

      <div className="basketPage">
        <h1 className="title">Səbətim</h1>

        <div className="table-info">
          <div className="icon">
            <MdTableBar />
          </div>
          <span className="label">Masa:</span>
          <span className="value">{masa ? masa : "-"}</span>
        </div>

        {isEmpty ? (
          <div className="empty-basket">
            <FiShoppingBag className="empty-icon" />
            <h2>Səbətiniz boşdur</h2>
            <p>Sifariş vermək üçün məhsul əlavə edin</p>
          </div>
        ) : (
          <div className="basket-content">
            <div className="product">
              {basketProducts.map((item) => (
                <div className="product-card" key={item.id}>
                  <div className="left">
                    <div className="product-image">
                      <img src={item.image} alt={item.name_az} />
                    </div>
                    <div className="text">
                      <h3>{item.name_az}</h3>
                      <p>{item.description_az}</p>
                    </div>
                  </div>
                  <div className="right">
                    <div className="product-controls">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        disabled={(item.quantity || 1) <= 1}
                        className={(item.quantity || 1) <= 1 ? "disabled" : ""}
                      >
                        -
                      </button>
                      <span>{item.quantity || 1}</span>
                      <button
                        onClick={() => increaseQuantity(item.id)}
                        disabled={isMaxQuantity(item.quantity)}
                        className={
                          isMaxQuantity(item.quantity) ? "disabled" : ""
                        }
                      >
                        +
                      </button>
                    </div>
                    <span className="price">
                      {(item.cost * (item.quantity || 1)).toFixed(2)} AZN
                    </span>
                    <div
                      className="closeBtn"
                      onClick={() => removeFromBasket(item.id)}
                    >
                      <IoCloseCircleOutline />
                    </div>
                    <div
                      className="closeResp"
                      onClick={() => removeFromBasket(item.id)}
                    >
                      <span>Sil</span>
                      <RiDeleteBin5Line />
                    </div>
                  </div>
                </div>
              ))}

              <div className="total-section">
                <form action="">
                  <div className="box1">
                    <label>Məhsul qiyməti</label>
                    <p>{calculateTotal()}</p>
                    <span>₼</span>
                  </div>
                  <div className="box1">
                    <label>Servis haqqı</label>
                    <p>{calculateServiceFee()}</p>
                    <span>₼</span>
                  </div>
                  <div className="box1">
                    <label>Ümumi hesab</label>
                    <p>{calculateGrandTotal()}</p>
                    <span>₼</span>
                  </div>
                  <div className="box1">
                    <label>Hazırlanma müddəti</label>
                    <p>{calculateTotalTime()}</p>
                    <span>₼</span>
                  </div>
                </form>
              </div>

              <input placeholder="Mətbəx üçün qeyd" />
              <button className="confirm-btn">
                <div className="buttonnn">Təsdiq et</div>
              </button>
            </div>

            <h2 className="other-products">Digər məhsullar</h2>
            <div className="other-list">
              <Swiper
                slidesPerView={3}
                spaceBetween={30}
                freeMode={true}
                loop={true}
                pagination={{ clickable: true }}
                navigation={{
                  prevEl: ".custom-prev",
                  nextEl: ".custom-next",
                }}
                modules={[FreeMode, Pagination, Navigation]}
                breakpoints={{
                  320: { slidesPerView: 1 },
                  576: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1200: { slidesPerView: 4 },
                }}
                className="mySwiper"
              >
                <div className="custom-nav">
                  <button className="custom-prev">
                    <IoIosArrowBack />
                  </button>
                  <button className="custom-next">
                    <IoIosArrowForward />
                  </button>
                </div>

                {otherProducts.map((item) => (
                  <SwiperSlide key={item.id}>
                    <div className="product-card1">
                      <img src={item.image} alt={item.name_az} />
                      <div className="info">
                        <div className="text">
                          <h3>{item.name_az}</h3>
                          <p>{item.description_az}</p>
                        </div>
                        <span className="price">{item.cost} AZN</span>
                      </div>
                      <button
                        className="add-btn"
                        onClick={() => addToBasket(item)}
                      >
                        Səbətə əlavə et
                        <div className="icon">
                          <IoIosArrowRoundForward />
                        </div>
                      </button>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BasketPage1;
