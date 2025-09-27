import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { GoChecklist } from "react-icons/go";
import { IoBasketOutline, IoHomeOutline } from "react-icons/io5";
import { PiHamburgerLight } from "react-icons/pi";
import { RiArrowDownSLine } from "react-icons/ri";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar1.scss";

function Navbar1({ onSearch }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const langRef = useRef(null);
  const navigate = useNavigate();

  // i18next varsa istifadə et, yoxdursa default dəyərlər
  let tHook = { i18n: { language: "az", changeLanguage: null } };
  try {
    tHook = useTranslation();
  } catch (_) {}
  const { i18n } = tHook;

  // Ekran enini CSS dəyişəninə yaz (expanded üçün istifadə olunacaq)
  useEffect(() => {
    const setVW = () => {
      const vw = window.innerWidth; // cari ekran eni (px)
      document.documentElement.style.setProperty("--vw", `${vw}px`);
    };
    setVW();
    window.addEventListener("resize", setVW);
    window.addEventListener("orientationchange", setVW);
    return () => {
      window.removeEventListener("resize", setVW);
      window.removeEventListener("orientationchange", setVW);
    };
  }, []);

  // Bütün mövcud dillər
  const languages = [
    { code: "az", label: "Az" },
    { code: "en", label: "En" },
    { code: "ru", label: "Ru" },
  ];

  // Hazırki dili təyin et (2 hərf olaraq normalize et)
  const getCurrentLang = () => {
    if (i18n?.language) {
      const normalized = i18n.language.toLowerCase().slice(0, 2);
      if (languages.find((l) => l.code === normalized)) return normalized;
    }
    return "az";
  };

  const currentLang = getCurrentLang();

  // Dropdown üçün digər dilləri al (seçilən dildən başqa)
  const dropdownOptions = languages.filter((lang) => lang.code !== currentLang);

  const toggleSearch = () => setIsSearchOpen((s) => !s);
  const toggleLang = () => setLangOpen((s) => !s);
  const closeAllPopups = () => {
    setIsSearchOpen(false);
    setLangOpen(false);
  };

  // Click outside to close popups
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        langRef.current &&
        !langRef.current.contains(e.target)
      ) {
        closeAllPopups();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ESC key to close popups
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeAllPopups();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    } else {
      const to = `/mehsullar${query ? `?search=${encodeURIComponent(query)}` : ""}`;
      navigate(to);
    }
  };

  const handleChangeLanguage = (code) => {
    if (i18n?.changeLanguage) {
      i18n.changeLanguage(code);
    } else {
      console.log("Dil dəyişdirildi:", code);
    }
    setLangOpen(false);
  };

  return (
    <div className="navbar1">
      {/* Top Navigation */}
      <div className="navbar-top">
        <div className="navbar-container">
          <div className={`logo-text ${isSearchOpen ? "delete" : ""}`}>ToxuNush</div>

          {/* Mobil layout üçün boş placeholder (sənin kodunda var idi) */}
          <div className={`hidden ${isSearchOpen ? "hiddenmode" : ""}`}>a</div>

          {/* Desktop menu */}
          <nav className="navbar-menu desktop-only" aria-label="Primary">
            <NavLink to="/" className={({ isActive }) => `menu-item${isActive ? " active" : ""}`} end>
              Ana səhifə
            </NavLink>
            <NavLink to="/product" className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}>
              Məhsullar
            </NavLink>
            <NavLink to="/myOrder" className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}>
              Sifarişlərim
            </NavLink>
            <NavLink to="/basket" className={({ isActive }) => `menu-item${isActive ? " active" : ""}`}>
              Səbət
            </NavLink>
          </nav>

          {/* Actions: Search + Language */}
          <div className="navbar-actions">
            {/* Search */}
            <div className={`search-button ${isSearchOpen ? "open" : ""}`} ref={searchRef}>
              <button
                type="button"
                className={`search-toggle ${isSearchOpen ? "open" : ""}`}
                aria-label="Axtarış"
                aria-expanded={isSearchOpen}
                onClick={toggleSearch}
              >
                <CiSearch />
              </button>
              <form className="search-form" onSubmit={handleSearchSubmit}>
                <input
                  className={`search-input ${isSearchOpen ? "expanded" : ""}`}
                  type="text"
                  placeholder="Məhsul axtar"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Məhsul axtar"
                />
              </form>
            </div>

            {/* Language */}
            <div className={`language-selector ${langOpen ? "open" : ""}`} ref={langRef}>
              <button
                type="button"
                className="language-trigger"
                onClick={toggleLang}
                aria-haspopup="menu"
                aria-expanded={langOpen}
                aria-label="Dil seç"
              >
                <span className="language-text">
                  {languages.find((l) => l.code === currentLang)?.label || "Az"}
                </span>
                <RiArrowDownSLine className={`dropdown-icon ${langOpen ? "rotated" : ""}`} />
              </button>

              <div className="language-dropdown" role="menu" aria-label="Dillər">
                {dropdownOptions.map((l, idx) => (
                  <button
                    key={l.code}
                    type="button"
                    role="menuitem"
                    className={`language-item${idx === dropdownOptions.length - 1 ? " last" : ""}`}
                    onClick={() => handleChangeLanguage(l.code)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="navbar-bottom mobile-only">
        <nav className="bottom-nav" aria-label="Mobile Navigation">
          <NavLink to="/" className={({ isActive }) => `bottom-nav-item${isActive ? " active" : ""}`} end>
            <IoHomeOutline className="nav-icon" />
            <span className="nav-text">Ana səhifə</span>
          </NavLink>

          <NavLink to="/product" className={({ isActive }) => `bottom-nav-item${isActive ? " active" : ""}`}>
            <PiHamburgerLight className="nav-icon" />
            <span className="nav-text">Məhsullar</span>
          </NavLink>

          <NavLink to="/basket" className={({ isActive }) => `bottom-nav-item${isActive ? " active" : ""}`}>
            <IoBasketOutline className="nav-icon" />
            <span className="nav-text">Səbət</span>
          </NavLink>

          <NavLink to="/myOrder" className={({ isActive }) => `bottom-nav-item${isActive ? " active" : ""}`}>
            <GoChecklist className="nav-icon" />
            <span className="nav-text">Sifarişlər</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}

export default Navbar1;
