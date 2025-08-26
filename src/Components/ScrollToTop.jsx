import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Smooth scroll-to-top on route change.
 * - target: "window" və ya CSS selector (məs., "#admin-content")
 * - behavior: "smooth" | "auto"
 */
export default function ScrollToTop({ target = "window", behavior = "smooth" }) {
  const { pathname } = useLocation();

  useEffect(() => {
    const el = target === "window" ? window : document.querySelector(target);
    if (!el) return;

    // window üçün
    if (el === window) {
      try {
        window.scrollTo({ top: 0, left: 0, behavior });
      } catch {
        window.scrollTo(0, 0);
      }
      return;
    }

    // daxili scroll konteyneri üçün
    try {
      el.scrollTo({ top: 0, left: 0, behavior });
    } catch {
      el.scrollTop = 0;
      el.scrollLeft = 0;
    }
  }, [pathname, target, behavior]);

  return null;
}
