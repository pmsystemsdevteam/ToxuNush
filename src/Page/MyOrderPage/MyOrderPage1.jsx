import React from "react";
import "./MyOrderPage1.scss";
import Left from "../../Image/OrderLeft.png";
import Right from "../../Image/OrderRight.png";
import Down from "../../Image/down.png";
import Up from "../../Image/up.png";
import { PiCallBellFill } from "react-icons/pi";
import { ImUserTie } from "react-icons/im";
import { RiBillFill } from "react-icons/ri";

function MyOrderPage1() {
  const steps = [
    { id: 1, time: "12:30", label: "Sifariş qəbul edildi", status: "done" },
    {
      id: 2,
      time: "12:30",
      label: "Sifariş aşpaza göndərildi",
      status: "done",
    },
    { id: 3, time: "12:35", label: "Yemək hazırlanır", status: "active" },
    { id: 4, time: "12:50", label: "Təhvil verildi", status: "pending" },
  ];

  const prevFilled = (prev) =>
    !!prev && (prev.status === "done" || prev.status === "active");

  const dotFilled = (s) => s === "done";
  const dotFilledTwo = (s) => s === "active";

  return (
    <section id="myOrderPage1">
      <div className="frontPage">
        <img src={Left} className="left" alt="left-decor" />
        <img src={Right} className="right" alt="right-decor" />
      </div>

      <div className="container">
        <header className="page-head">
          <h1>Sifarişlər</h1>
          <p>Sifarişlərinizi izləyin.</p>
        </header>

        <div className="ticket">
          <img src={Up} className="up-box" alt="" />
          <img src={Down} className="down-box" alt="" />
          <div className="ticket-head">
            <div className="brand">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmg6YrfolWPXiQAQIz0s473J174_G0za4lwA&s"
                alt="brand"
              />
            </div>
            <span className="time">Sifariş vaxtı: 12:25</span>
          </div>

          <div className="row two">
            <span>Masa</span>
            <span>№ 12</span>
          </div>

          <div className="row three header">
            <span>Məhsul</span>
            <span>Say</span>
            <span>Qiymət</span>
          </div>

          <div className="row three">
            <span>Dolma</span>
            <span>1</span>
            <span>4.50</span>
          </div>

          <div className="row three">
            <span>Qatıq</span>
            <span>1</span>
            <span>4.50</span>
          </div>

          <div className="row two total">
            <span>Ümumi</span>
            <span>9₼</span>
          </div>

          <p className="note">
            Qeydiniz: Zəhmət olmasa yeməkdə pul bibəri az istifadə edəsiz.
          </p>
        </div>

        {/* PROGRESS LINE */}
        <div className="steps">
          {steps.map((step, i) => {
            const prev = steps[i - 0];
            return (
              <div className="step-wrap" key={step.id}>
                {i > 0 && (
                  <div className="seg">
                    <div className="track" />
                    <div className={`fill ${prevFilled(prev) ? "on" : ""}`} />
                  </div>
                )}

                <div
                  className={`dot ${dotFilled(step.status) ? "on" : ""} ${
                    dotFilledTwo(step.status) ? "on2" : ""
                  }`}
                >
                  {step.id}
                </div>

                <div className="meta">
                  <span
                    className={`t ${step.status !== "pending" ? "on" : ""}`}
                  >
                    {step.time}
                  </span>
                  <span
                    className={`s ${
                      step.status === "active"
                        ? "strong"
                        : step.status === "done"
                        ? "mid"
                        : ""
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="btn-row">
          <button className="primary">Yenidən sifariş et</button>
          <button className="ghost">Sifarişi ləğv et</button>
        </div>

        <div className="hero__actions">
          <button type="button" className="btn btn--primary">
            <div className="icon">
              <RiBillFill />
            </div>
            <span>Hesabı istə</span>
          </button>

          <button type="button" className="btn btn--secondary">
            <div className="icon">
              <ImUserTie />
            </div>
            <span>Ofisiantı çağır</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default MyOrderPage1;
