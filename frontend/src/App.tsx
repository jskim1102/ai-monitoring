import { Routes, Route } from "react-router-dom";
import Shell from "./layouts/Shell";
import MonitorPage from "./pages/MonitorPage";
import CamerasPage from "./pages/CamerasPage";
import Toast from "./components/Toast";

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<MonitorPage />} />
          <Route path="cameras" element={<CamerasPage />} />
        </Route>
      </Routes>
      <Toast />
    </>
  );
}
