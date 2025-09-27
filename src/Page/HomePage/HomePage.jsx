import React, { useEffect, useMemo, useState } from "react";
import "./HomePage.scss";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

// -------- API URLs ----------
const TABLES_URL = "http://192.168.0.164:8000/api/tables/";
const ROOMS_URL = "http://192.168.0.164:8000/api/rooms/";
const BASKETS_URL = "http://192.168.0.164:8000/api/baskets/";
const ROOM_BASKETS_URL = "http://192.168.0.164:8000/api/room-baskets/";
const TIMES_URL = "http://192.168.0.164:8000/api/restoranttime/";

// -------- localStorage keys ----------
const ACTIVE_CTX_KEY = "activeContext"; // 't' | 'r'
const TABLE_KEY = "table"; // masa nömrəsi (məs: "4")
const ROOM_KEY = "room"; // otaq nömrəsi (məs: "12")

// ---- Saat yardımçıları ----
const parseHHMMSS = (s) => {
  if (!s) return null;
  const [hh = "0", mm = "0"] = String(s).split(":");
  const h = Number(hh),
    m = Number(mm);
  if ([h, m].some((x) => Number.isNaN(x))) return null;
  return h * 60 + m; // dəqiqə ilə
};
const nowMinutesLocal = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
/** start<=end: [start,end], start>end: (gecəni keçir) => now>=start || now<=end */
const isNowInWindow = (nowMin, startMin, endMin) => {
  if (startMin == null || endMin == null) return false;
  if (startMin === endMin) return false; // 24/7 qəbul etmirik; lazım olsa dəyiş
  if (startMin < endMin) return nowMin >= startMin && nowMin <= endMin;
  return nowMin >= startMin || nowMin <= endMin; // wrap over midnight
};

function HomePage() {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  // Konteksdən asılı status/meta
  const [ctxStatus, setCtxStatus] = useState(null); // yalnız MASA üçün
  const [ctxMeta, setCtxMeta] = useState({
    kind: null, // 't' | 'r'
    number: null, // 4, 12...
    id: null, // table.id və ya room.id
    raw: null, // tam obyekt
  });

  // Saat konfiqi
  const [timeCfg, setTimeCfg] = useState(null); // {rs, re, os, oe}
  const [nowMin, setNowMin] = useState(nowMinutesLocal());

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const notify = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  };

  // URL-də slug varmı? (məs: /4t, /12r → true; / → false)
  const hasSlug = useMemo(() => {
    const seg = (pathname || "/").split("/")[1] || "";
    return /^\d+[tr]$/i.test(seg);
  }, [pathname]);

  // URL-dən (məs: /4t, /12r) konteksti oxu və localStorage-a yaz
  const hydrateContextFromPath = () => {
    const seg = (pathname || "/").split("/")[1];
    const m = seg && String(seg).match(/^(\d+)([tr])$/i);
    if (!m) return null;

    const number = Number(m[1]);
    const kind = m[2].toLowerCase(); // 't' | 'r'
    if (!Number.isInteger(number) || number <= 0) return null;

    if (kind === "t") {
      localStorage.setItem(TABLE_KEY, String(number));
      localStorage.setItem(ACTIVE_CTX_KEY, "t");
      localStorage.removeItem(ROOM_KEY);
    } else if (kind === "r") {
      localStorage.setItem(ROOM_KEY, String(number));
      localStorage.setItem(ACTIVE_CTX_KEY, "r");
      localStorage.removeItem(TABLE_KEY);
    }
    window.dispatchEvent(new Event("ctx_changed"));
    return { kind, number };
  };

  // Aktiv konteksti localStorage-dan oxu
  const getActiveContext = () => {
    const kind = (localStorage.getItem(ACTIVE_CTX_KEY) || "").toLowerCase();
    if (kind === "t") {
      const n = Number(localStorage.getItem(TABLE_KEY));
      return Number.isInteger(n) && n > 0
        ? { kind: "t", number: n }
        : { kind: null, number: null };
    }
    if (kind === "r") {
      const n = Number(localStorage.getItem(ROOM_KEY));
      return Number.isInteger(n) && n > 0
        ? { kind: "r", number: n }
        : { kind: null, number: null };
    }
    return { kind: null, number: null };
  };

  // Kontekstə uyğun meta/status gətir
  const bootstrap = async (pref = null) => {
    const base = pref || getActiveContext();
    if (!base?.kind || !base?.number) {
      setCtxMeta({ kind: null, number: null, id: null, raw: null });
      setCtxStatus(null);
      return;
    }

    const { kind, number } = base;
    try {
      if (kind === "t") {
        const tRes = await axios.get(TABLES_URL);
        const tables = Array.isArray(tRes.data) ? tRes.data : [];
        const table = tables.find(
          (t) => Number(t.table_num) === Number(number)
        );
        if (table) {
          setCtxMeta({ kind, number, id: table.id, raw: table });
          setCtxStatus(table.status || null);
        } else {
          setCtxMeta({ kind, number, id: null, raw: null });
          setCtxStatus(null);
        }
      } else if (kind === "r") {
        const rRes = await axios.get(ROOMS_URL);
        const rooms = Array.isArray(rRes.data) ? rRes.data : [];
        const room = rooms.find((r) => Number(r.room_num) === Number(number));
        if (room) {
          setCtxMeta({ kind, number, id: room.id, raw: room });
        } else {
          setCtxMeta({ kind, number, id: null, raw: null });
          setCtxStatus(null);
        }
      }
    } catch {
      // sessiz
    }
  };

  // Saat konfiqini çək — MASSİVDƏN EN SON QEYDİ SEÇ
  const fetchTimes = async () => {
    try {
      const res = await axios.get(TIMES_URL);
      const arr = Array.isArray(res?.data) ? res.data : [];
      if (!arr.length) {
        setTimeCfg(null);
        return;
      }
      // ən son konfiqi seçirik (id böyük olan)
      const latest = [...arr].sort((a, b) => (a?.id ?? 0) - (b?.id ?? 0)).pop();
      const rs = parseHHMMSS(latest?.restoran_start_time);
      const re = parseHHMMSS(latest?.restoran_end_time);
      const os = parseHHMMSS(latest?.online_start_time);
      const oe = parseHHMMSS(latest?.online_end_time);
      setTimeCfg({ rs, re, os, oe, raw: latest });
    } catch (e) {
      console.error("Restoran vaxtları alınmadı:", e);
      setTimeCfg(null);
    }
  };

  // İlk açılış və path dəyişəndə
  useEffect(() => {
    const fromUrl = hydrateContextFromPath();
    bootstrap(fromUrl || undefined);
    fetchTimes();

    const onCtxChanged = () => bootstrap();
    window.addEventListener("ctx_changed", onCtxChanged);

    const t = setInterval(() => setNowMin(nowMinutesLocal()), 30000);
    return () => {
      window.removeEventListener("ctx_changed", onCtxChanged);
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Hesablama: bu an aktivdirmi?
  const restaurantActive = useMemo(() => {
    if (!timeCfg) return null;
    return isNowInWindow(nowMin, timeCfg.rs, timeCfg.re);
  }, [timeCfg, nowMin]);

  const onlineActive = useMemo(() => {
    if (!timeCfg) return null;
    return isNowInWindow(nowMin, timeCfg.os, timeCfg.oe);
  }, [timeCfg, nowMin]);

  // Ofisiant ilə Əlaqə (masa/otaq fərqli endpoint-ə yazılır)
  const handleCallWaiter = async (e) => {
    e.preventDefault();
    if (sending) return;

    const { kind, number, id } = ctxMeta;
    if (!kind || !number) {
      notify("Masa/Otaq nömrəsi tapılmadı. NFC linkindən daxil olun.");
      return;
    }

    try {
      setSending(true);

      if (kind === "t") {
        const tRes = await axios.get(TABLES_URL);
        const tables = Array.isArray(tRes.data) ? tRes.data : [];
        const table = tables.find(
          (t) => Number(t.table_num) === Number(number)
        );
        if (!table) {
          notify(`Masa #${number} tapılmadı.`);
          return;
        }

        setCtxMeta({ kind, number, id: table.id, raw: table });
        setCtxStatus(table.status || null);

        if (table.status === "reserved") {
          notify(`Masa #${number} rezervdir. Əməliyyat mümkün deyil.`);
          return;
        }

        try {
          await axios.patch(
            `${TABLES_URL}${table.id}/`,
            { status: "waitingWaiter" },
            { headers: { "Content-Type": "application/json" } }
          );
          setCtxStatus("waitingWaiter");
        } catch {}

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
      } else if (kind === "r") {
        if (!id) {
          notify(`Otaq #${number} tapılmadı.`);
          return;
        }
        await axios.post(
          ROOM_BASKETS_URL,
          {
            room_id: id,
            note: "Ofisiant çağırıldı (otaq)",
            service_cost: "2.50",
            items: [],
          },
          { headers: { "Content-Type": "application/json" } }
        );
        toast("Ofisiant çağırıldı (otaq)", {
          icon: "🛎️",
          style: {
            marginTop: "70px",
            borderRadius: "12px",
            height: "48px",
            background: "yellow",
            fontFamily: "Times New Roman, serif",
          },
        });
      }
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

    const { kind, number } = ctxMeta;
    if (!kind || !number) {
      notify("Masa/Otaq nömrəsi tapılmadı. NFC linkindən daxil olun.");
      return;
    }

    try {
      setSending(true);

      if (kind === "t") {
        const tRes = await axios.get(TABLES_URL);
        const tables = Array.isArray(tRes.data) ? tRes.data : [];
        const table = tables.find(
          (t) => Number(t.table_num) === Number(number)
        );
        if (!table) {
          notify(`Masa #${number} tapılmadı.`);
          return;
        }
        setCtxMeta({ kind, number, id: table.id, raw: table });
        setCtxStatus(table.status || null);

        if (table.status === "reserved") {
          notify(`Masa #${number} rezervdir. Sifariş vermək mümkün deyil.`);
          return;
        }
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

  // Hesabı istə (waitingService | ordered -> waitingBill)
  const handleRequestBill = async (e) => {
    e.preventDefault();
    if (sending) return;

    const { kind, id, number } = ctxMeta;
    if (kind !== "t" || !id) {
      notify("Bu əməliyyat yalnız masa üçün keçərlidir.");
      return;
    }
    try {
      setSending(true);
      await axios.patch(
        `${TABLES_URL}${id}/`,
        { status: "waitingBill" },
        { headers: { "Content-Type": "application/json" } }
      );
      setCtxStatus("waitingBill");
      toast(`Masa #${number}: Hesab istənildi`, {
        icon: "🧾",
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

  // Button status mətnləri
  const RES_MSG_OFF = "Hal-hazırda restoran xidmət göstərmir";
  const ONL_MSG_OFF = "Hal-hazırda restoran online xidmət göstərmir";
  const ALL_OFF = "Hazırda xidmət göstərmir";

  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Lezzet Restoranına Xoş Gəlmisiniz</h1>
          <p>
            Ən dadlı ənənəvi yeməkləri sizə çatdırırıq. Sifariş etmək üçün
            aşağıdakı seçimlərdən birini seçin.
          </p>

          {/* STATUSA GÖRƏ UI (yalnız masa üçün bəzi bloklar) */}
          {ctxMeta.kind === "t" && ctxStatus === "reserved" ? (
            <div className="button-container">
              <Link
                to="#"
                onClick={(e) => e.preventDefault()}
                className="btn btn-reserv disabled"
              >
                <i className="fa-solid fa-xmark" />
                Masa Rezervdir
              </Link>
            </div>
          ) : ctxMeta.kind === "t" && ctxStatus === "waitingService" ? (
            // waitingService -> yalnız Hesabı istə
            <div className="button-container">
              <Link
                to="#"
                onClick={handleRequestBill}
                className={`btn btn-bill ${sending ? "disabled" : ""}`}
              >
                <i className="fa-solid fa-file-invoice-dollar" />
                Hesabı istə
              </Link>
            </div>
          ) : ctxMeta.kind === "t" && ctxStatus === "ordered" ? (
            // ordered -> (1) Hesab gözlənilir (functional), (2) info düyməsi
            <div className="button-container">
              <Link
                to="#"
                onClick={handleRequestBill}
                className={`btn btn-bill ${sending ? "disabled" : ""}`}
              >
                <i className="fa-solid fa-file-invoice-dollar" />
                Hesab gözlənilir
              </Link>
              <Link
                to="#"
                onClick={(e) => e.preventDefault()}
                className="btn btn-done disabled"
              >
                <i className="fas fa-check-circle" />
                Yeməkləriniz təhvil verildi — nuş olsun!
              </Link>
            </div>
          ) : ctxMeta.kind === "t" && ctxStatus === "waitingBill" ? (
            // waitingBill -> informativ
            <div className="button-container">
              <Link
                to="#"
                onClick={(e) => e.preventDefault()}
                className="btn btn-bill"
              >
                <i className="fa-solid fa-hourglass-half" />
                Hesab gözlənilir
              </Link>
            </div>
          ) : (
            // Əks halda düymələr URL formasına görə:
            <div className="button-container">
              {hasSlug ? (
                // URL slug-ludursa: yalnız Özün Sifariş Et + Ofisiant ilə Əlaqə
                <>
                  <Link
                    to="#"
                    onClick={handleSelfOrder}
                    className={`btn btn-secondary ${sending ? "disabled" : ""}`}
                  >
                    <i className="fas fa-utensils" /> Özün Sifariş Et
                  </Link>
                  <Link
                    to="#"
                    onClick={handleCallWaiter}
                    className={`btn btn-primary ${sending ? "disabled" : ""}`}
                  >
                    <i className="fa-solid fa-user-tie" />{" "}
                    {sending ? "Göndərilir..." : "Ofisiant ilə Əlaqə"}
                  </Link>
                </>
              ) : (
                // URL sadədirsə: yalnız Rezerv Et + Otağa Sifariş (iş saatlarına görə aç/qapalı)
                <>
                  <Link
                    to={restaurantActive ? "/rezerv" : "#"}
                    onClick={(e) => {
                      if (!restaurantActive) e.preventDefault();
                    }}
                    className={`btn btn-rezerv ${
                      restaurantActive ? "" : "disabled"
                    }`}
                    aria-disabled={!restaurantActive}
                  >
                    <i className="fa-solid fa-bell-concierge" />

                    {restaurantActive ? "Rezerv Et" : ""}
                    <span className="btn-status">
                      {timeCfg
                        ? restaurantActive
                          ? ""
                          : onlineActive
                          ? RES_MSG_OFF
                          : ALL_OFF
                        : "Saatlar yüklənir..."}
                    </span>
                  </Link>

                  <Link
                    to={onlineActive ? "/order" : "#"}
                    onClick={(e) => {
                      if (!onlineActive) e.preventDefault();
                    }}
                    className={`btn btn-room ${onlineActive ? "" : "disabled"}`}
                    aria-disabled={!onlineActive}
                  >
                    <i className="fa-solid fa-door-open" />
                    {onlineActive ? " Otağa Sifariş" : ""}
                    <span className="btn-status">
                      {timeCfg
                        ? onlineActive
                          ? ""
                          : restaurantActive
                          ? ONL_MSG_OFF
                          : ALL_OFF
                        : "Saatlar yüklənir..."}
                    </span>
                  </Link>
                </>
              )}
            </div>
          )}

          {msg && <div className="notice">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
