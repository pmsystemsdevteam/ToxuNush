import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HomePage1.scss";
import { PiCallBellFill } from "react-icons/pi";
import { ImUserTie } from "react-icons/im";
import Left from "../../Image/HomeLeft.png";
import Right from "../../Image/HomeRight.png";

const API_URL = "http://172.20.5.167:8001/api/tables/";

function HomePage1() {
  const navigate = useNavigate();

  // 🔹 Ofisiant çağırmaq üçün status göndərmə funksiyası
  const callWaiter = async () => {
    try {
      const tableNum = localStorage.getItem("table_num");
      if (!tableNum) {
        alert("Masa nömrəsi tapılmadı!");
        return;
      }

      // Masanı tap
      const res = await axios.get(API_URL);
      const table = res.data.find(
        (t) => String(t.table_num) === String(tableNum)
      );

      if (!table) {
        alert("Masa tapılmadı!");
        return;
      }

      // Mövcud masanın statusunu dəyiş (PATCH)
      await axios.patch(`${API_URL}${table.id}/`, { status: "waitingWaiter" });

      console.log("📌 Ofisiant çağırıldı:", {
        table_id: table.id,
        table_num: table.table_num,
        status: "waitingWaiter",
      });

      alert("Ofisiant çağırıldı ✅");
    } catch (err) {
      console.error("❌ PATCH error:", err);
      alert("Xəta baş verdi, zəhmət olmasa yenidən yoxla!");
    }
  };

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
            {/* Özün sifariş et → sadəcə product səhifəsinə yönləndirir */}
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => navigate("/product")}
            >
              <div className="icon">
                <PiCallBellFill />
              </div>
              <span>Özün sifariş et</span>
            </button>

            {/* Ofisiant ilə əlaqə → PATCH göndərir */}
            <button
              type="button"
              className="btn btn--secondary"
              onClick={callWaiter}
            >
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
