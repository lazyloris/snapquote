import { useEffect, useState, type MouseEvent } from "react";

// A tiny router: real paths (/new, /quotes, /q) with history.pushState.
export function navigate(to: string) {
  window.history.pushState({}, "", to);
  window.dispatchEvent(new Event("sq:navigate"));
  window.scrollTo(0, 0);
}

export function useLocation() {
  const get = () => ({ path: window.location.pathname, hash: window.location.hash, search: window.location.search });
  const [loc, setLoc] = useState(get);
  useEffect(() => {
    const on = () => setLoc(get());
    window.addEventListener("popstate", on);
    window.addEventListener("hashchange", on);
    window.addEventListener("sq:navigate", on);
    return () => {
      window.removeEventListener("popstate", on);
      window.removeEventListener("hashchange", on);
      window.removeEventListener("sq:navigate", on);
    };
  }, []);
  return loc;
}

export function linkProps(to: string) {
  return {
    href: to,
    onClick: (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(to);
    },
  };
}
