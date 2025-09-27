import React from "react";
import "./HomePage1.scss";
import { PiCallBellFill } from "react-icons/pi";
import { ImUserTie } from "react-icons/im";
import Left from "../../Image/HomeLeft.png";
import Right from "../../Image/HomeRight.png";

function HomePage1() {
  return (
    <section id="homePage1">
      <div className="frontPage">
        <img src={Left} className="left" alt="" />
        <img src={Right} className="right" alt="" />
      </div>
      <div className="hero">
        <div className="hero__content">
          <h1 className="hero__title">Ləzzət Restoranına Xoş Gəlmisiniz</h1>

          <p className="hero__subtitle">
            Ən dadlı ənənəvi yeməkləri sizə çatdırırıq. Sifariş etmək üçün
            aşağıdakı seçimlərdən birini seçin.
          </p>

          <div className="hero__actions">
            <button type="button" className="btn btn--primary">
              <div className="icon">
                <PiCallBellFill />
              </div>
              <span>Özün sifariş et</span>
            </button>

            <button type="button" className="btn btn--secondary">
              <div className="icon">
                <ImUserTie />
              </div>
              <span>Ofisiant ilə əlaqə</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomePage1;
