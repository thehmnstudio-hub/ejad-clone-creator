import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * When the app is accessed via hq.ejadlabs.com,
 * automatically redirect non-admin routes to /admin.
 */
export function HQRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isHQ = window.location.hostname === "hq.ejadlabs.com";
    if (isHQ && !location.pathname.startsWith("/admin")) {
      navigate("/admin", { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}
