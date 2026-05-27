import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

const S: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    paddingTop: "var(--topbar-h)",
    position: "relative",
    zIndex: 1,
  },
  main: {
    flex: 1,
    marginLeft: "var(--sidebar-w)",
    padding: "var(--s-6) var(--s-5)",
    maxWidth: 1600,
    minWidth: 0,
  },
};

export default function Shell() {
  return (
    <>
      <Topbar />
      <div style={S.shell}>
        <Sidebar />
        <main style={S.main}>
          <Outlet />
        </main>
      </div>
    </>
  );
}
