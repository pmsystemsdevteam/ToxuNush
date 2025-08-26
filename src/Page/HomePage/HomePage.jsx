import React, { useEffect, useState } from "react";
import "./HomePage.scss";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const TABLES_URL = "https://api.albanproject.az/api/tables/";
const BASKETS_URL = "https://api.albanproject.az/api/baskets/";

function HomePage() {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [tableStatus, setTableStatus] = useState(null); // "reserved" | "ordered" | ...
  const [tableMeta, setTableMeta] = useState({ number: null, id: null }); // {number, id}
  const navigate = useNavigate();

  const getTableNumber = () => {
    const fromKey = localStorage.getItem("tableNumber");
    if (fromKey && !Number.isNaN(Number(fromKey))) return Number(fromKey);
    const last = localStorage.getItem("lastVisitedPage") || "";
    const seg = last.split("/")[1];
    const n = Number(seg);
    return Number.isNaN(n) ? null : n;
  };

  const notify = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  };

  // İlk açılış: masa nömrəsini yadda saxla və statusu çək
  useEffect(() => {
    const location = window.location.pathname;
    localStorage.setItem("lastVisitedPage", location);
    const seg = (location || "").split("/")[1];
    if (seg && !Number.isNaN(Number(seg))) {
      localStorage.setItem("tableNumber", String(Number(seg)));
    }

    const bootstrap = async () => {
      const tableNum = getTableNumber();
      if (!tableNum) return;

      try {
        const tRes = await axios.get(TABLES_URL);
        const tables = Array.isArray(tRes.data) ? tRes.data : [];
        const table = tables.find(
          (t) => Number(t.table_num) === Number(tableNum)
        );
        if (table) {
          setTableMeta({ number: table.table_num, id: table.id });
          setTableStatus(table.status || null);
        }
      } catch {
        // sessiz
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ofisiant ilə Əlaqə
  const handleCallWaiter = async (e) => {
    e.preventDefault();
    if (sending) return;

    const tableNum = getTableNumber();
    if (!tableNum) {
      notify("Masa nömrəsi tapılmadı. NFC linkindən daxil olun.");
      return;
    }

    try {
      setSending(true);

      // həmişə ən son status
      const tRes = await axios.get(TABLES_URL);
      const tables = Array.isArray(tRes.data) ? tRes.data : [];
      const table = tables.find(
        (t) => Number(t.table_num) === Number(tableNum)
      );
      if (!table) {
        notify(`Masa #${tableNum} tapılmadı.`);
        return;
      }

      setTableMeta({ number: table.table_num, id: table.id });
      setTableStatus(table.status || null);

      if (table.status === "reserved") {
        notify(`Masa #${tableNum} rezervdir. Əməliyyat mümkün deyil.`);
        return;
      }
      if (table.status === "ordered") {
        notify("Yeməkləriniz artıq təhvil verilib. Nuş olsun!");
        return;
      }

      // Statusu waitingWaite et
      await axios.patch(
        `${TABLES_URL}${table.id}/`,
        { status: "waitingWaite" },
        { headers: { "Content-Type": "application/json" } }
      );
      setTableStatus("waitingWaite");

      // Baskets-ə POST (log)
      await axios.post(
        BASKETS_URL,
        {
          table_id: table.id,
          note: "Ofisiant çağırıldı",
          service_cost: "2.50",
          items: [],
        },
        { headers: { "Content-Type": "application/json" } }
      );

      // notify(`Masa #${tableNum}: Ofisiant çağırıldı.`);
      toast("Ofisiant çağırıldı", {
        icon: "🤵🏻",
        style: {
          marginTop: "70px",
          borderRadius: "12px",
          height: "48px",
          background: "yellow",
          fontFamily: "Times New Roman, serif",
        },
      });
    } catch (err) {
      const detail = err?.response?.data
        ? `Xəta: ${JSON.stringify(err.response.data)}`
        : err?.message || "Naməlum xəta.";
      notify(detail);
    } finally {
      setSending(false);
    }
  };

  // Özün Sifariş Et
  const handleSelfOrder = async (e) => {
    e.preventDefault();
    if (sending) return;

    const tableNum = getTableNumber();
    if (!tableNum) {
      notify("Masa nömrəsi tapılmadı. NFC linkindən daxil olun.");
      return;
    }

    try {
      setSending(true);

      const tRes = await axios.get(TABLES_URL);
      const tables = Array.isArray(tRes.data) ? tRes.data : [];
      const table = tables.find(
        (t) => Number(t.table_num) === Number(tableNum)
      );
      if (!table) {
        notify(`Masa #${tableNum} tapılmadı.`);
        return;
      }

      setTableMeta({ number: table.table_num, id: table.id });
      setTableStatus(table.status || null);

      if (table.status === "reserved") {
        notify(`Masa #${tableNum} rezervdir. Sifariş vermək mümkün deyil.`);
        return;
      }
      if (table.status === "ordered") {
        notify("Yeməkləriniz artıq təhvil verilib. Nuş olsun!");
        return;
      }

      navigate("/product");
    } catch (err) {
      const detail = err?.response?.data
        ? `Xəta: ${JSON.stringify(err.response.data)}`
        : err?.message || "Naməlum xəta.";
      notify(detail);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Lezzet Restoranına Xoş Gəlmisiniz</h1>
          <p>
            Ən dadlı ənənəvi yeməkləri sizə çatdırırıq. Sifariş etmək üçün
            aşağıdakı seçimlərdən birini seçin.
          </p>

          {/* STATUSA GÖRƏ UI */}
          {tableStatus === "reserved" ? (
            <div className="button-container">
              <Link
                to="#"
                onClick={(e) => e.preventDefault()}
                className={`btn btn-reserv ${sending ? "disabled" : ""}`}
              >
                <i className="fa-solid fa-xmark"></i>
                Masa Rezervdir
              </Link>
            </div>
          ) : tableStatus === "ordered" ? (
            <div className="button-container">
              <Link
                to="#"
                onClick={(e) => e.preventDefault()}
                className="btn btn-done disabled"
              >
                <i className="fas fa-check-circle"></i>
                Yeməkləriniz təhvil verildi — nuş olsun!
              </Link>
            </div>
          ) : (
            <div className="button-container">
              <Link
                to="#"
                onClick={handleCallWaiter}
                className={`btn btn-primary ${sending ? "disabled" : ""}`}
              >
                <i className="fa-solid fa-user-tie"></i>
                {sending ? "Göndərilir..." : "Ofisiant ilə Əlaqə"}
              </Link>

              <Link
                to="/product"
                onClick={handleSelfOrder}
                className={`btn btn-secondary ${sending ? "disabled" : ""}`}
              >
                <i className="fas fa-utensils"></i>
                Özün Sifariş Et
              </Link>
            </div>
          )}

          {msg && <div className="notice">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
