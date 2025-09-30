import React, { useState } from "react";
import "./BasketPage1.scss";
import { FiShoppingBag } from "react-icons/fi";
import Left from "../../Image/HomeLeft.png";
import Right from "../../Image/HomeRight.png";
import { MdTableBar } from "react-icons/md";
import { IoCloseCircleOutline } from "react-icons/io5";
import {
  IoIosArrowBack,
  IoIosArrowForward,
  IoIosArrowRoundForward,
} from "react-icons/io";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { FreeMode, Pagination } from "swiper/modules";
import { RiDeleteBin5Line } from "react-icons/ri";

function BasketPage1() {
  const [isEmpty, setIsEmpty] = useState(false);

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
          <span className="value">-</span>
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
              <div className="product-card">
                <div className="left">
                  <img
                    src="https://cdn.ye-mek.net/App_UI/Img/out/420/2022/04/sodali-kofte-resimli-yemek-tarifi(12).jpg"
                    alt="Dolma"
                    className="product-image"
                  />
                  <div className="text">
                    {" "}
                    <h3>Dolma</h3>
                    <p>
                      Ət, düyü və göyərti ilə doldurulmuş üzüm, bibər və kələm
                      yarpaqları
                    </p>
                  </div>
                </div>
                <div className="right">
                  <div className="product-controls">
                    <button>-</button>
                    <span>1</span>
                    <button>+</button>
                  </div>
                  <span className="price">12.00 AZN</span>
                  <div className="closeBtn">
                    <IoCloseCircleOutline />
                  </div>
                  <div className="closeResp">
                    <span>Sil</span>
                    <RiDeleteBin5Line />
                  </div>
                </div>
              </div>

              <textarea placeholder="Mətbəx üçün qeyd"></textarea>

              <button className="confirm-btn">Təsdiq et</button>
            </div>

            <h2 className="other-products">Digər məhsullar</h2>
            <div className="other-list">
              <Swiper
                slidesPerView={3}
                spaceBetween={30}
                freeMode={true}
                loop={true}
                pagination={{
                  clickable: true,
                }}
                keyboard={{
                  enabled: true,
                }}
                navigation={{
                  prevEl: ".custom-prev",
                  nextEl: ".custom-next",
                }}
                modules={[FreeMode, Pagination, Navigation]}
                className="mySwiper"
                breakpoints={{
                  320: { slidesPerView: 1 },
                  576: { slidesPerView: 2 },
                  768: { slidesPerView: 3 },
                  1200: { slidesPerView: 4 },
                }}
              >
                <div className="custom-nav">
                  <button className="custom-prev">
                    <IoIosArrowBack />
                  </button>
                  <button className="custom-next">
                    <IoIosArrowForward />
                  </button>
                </div>
                <SwiperSlide>
                  <div className="product-card1">
                    <img
                      src="https://cdn.ye-mek.net/App_UI/Img/out/420/2022/04/sodali-kofte-resimli-yemek-tarifi(12).jpg"
                      alt="Dolma"
                    />
                    <div className="info">
                      <div className="text">
                        <h3>Dolma</h3>
                        <p>isti, ət</p>
                      </div>
                      <span className="price">8.00 AZN</span>
                    </div>
                    <button className="add-btn">
                      Səbətə əlavə et
                      <div className="icon">
                        <IoIosArrowRoundForward />
                      </div>
                    </button>
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <div className="product-card1">
                    <img
                      src="https://cdn.ye-mek.net/App_UI/Img/out/420/2022/04/sodali-kofte-resimli-yemek-tarifi(12).jpg"
                      alt="Dolma"
                    />
                    <div className="info">
                      <div className="text">
                        <h3>Dolma</h3>
                        <p>isti, ət</p>
                      </div>
                      <span className="price">8.00 AZN</span>
                    </div>
                    <button className="add-btn">
                      Səbətə əlavə et
                      <div className="icon">
                        <IoIosArrowRoundForward />
                      </div>
                    </button>
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <div className="product-card1">
                    <img
                      src="https://cdn.ye-mek.net/App_UI/Img/out/420/2022/04/sodali-kofte-resimli-yemek-tarifi(12).jpg"
                      alt="Dolma"
                    />
                    <div className="info">
                      <div className="text">
                        <h3>Dolma</h3>
                        <p>isti, ət</p>
                      </div>
                      <span className="price">8.00 AZN</span>
                    </div>
                    <button className="add-btn">
                      Səbətə əlavə et
                      <div className="icon">
                        <IoIosArrowRoundForward />
                      </div>
                    </button>
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <div className="product-card1">
                    <img
                      src="https://cdn.ye-mek.net/App_UI/Img/out/420/2022/04/sodali-kofte-resimli-yemek-tarifi(12).jpg"
                      alt="Dolma"
                    />
                    <div className="info">
                      <div className="text">
                        <h3>Dolma</h3>
                        <p>isti, ət</p>
                      </div>
                      <span className="price">8.00 AZN</span>
                    </div>
                    <button className="add-btn">
                      Səbətə əlavə et
                      <div className="icon">
                        <IoIosArrowRoundForward />
                      </div>
                    </button>
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <div className="product-card1">
                    <img
                      src="https://cdn.ye-mek.net/App_UI/Img/out/420/2022/04/sodali-kofte-resimli-yemek-tarifi(12).jpg"
                      alt="Dolma"
                    />
                    <div className="info">
                      <div className="text">
                        <h3>Dolma</h3>
                        <p>isti, ət</p>
                      </div>
                      <span className="price">8.00 AZN</span>
                    </div>
                    <button className="add-btn">
                      Səbətə əlavə et
                      <div className="icon">
                        <IoIosArrowRoundForward />
                      </div>
                    </button>
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BasketPage1;
