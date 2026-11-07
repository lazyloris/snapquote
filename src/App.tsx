import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import Landing from "./pages/Landing";
import QuoteView from "./pages/QuoteView";
import { linkProps, useLocation } from "./lib/router";

function Nav({ path }: { path: string }) {
  return (
    <nav className="nav no-print">
      <div className="wrap nav__in">
        <a className="logo" {...linkProps("/")}>
          <img src="/favicon.svg" alt="" width="26" height="26" />
          Snapquote
        </a>
        <div className="nav__links">
          <a className={path === "/quotes" ? "on" : ""} {...linkProps("/quotes")}>
            My quotes
          </a>
          <a className="btn btn--sm btn--brand" {...linkProps("/new")}>
            New quote
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const { path, hash, search } = useLocation();

  // The client-facing page is clean: no app chrome, just the business's quote.
  if (path === "/q") return <QuoteView key={hash} hash={hash} />;

  let page;
  if (path === "/new") {
    const draft = new URLSearchParams(search).get("draft") ?? undefined;
    page = <Editor key={"new" + search} draft={draft} />;
  } else if (path.startsWith("/edit/")) {
    const id = path.slice(6);
    page = <Editor key={id} id={id} />;
  } else if (path === "/quotes") page = <Dashboard />;
  else page = <Landing />;

  return (
    <>
      <Nav path={path} />
      {page}
    </>
  );
}
