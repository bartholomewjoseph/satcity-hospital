import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { HospitalProvider } from "./lib/store";
import { LandingPage, EmergencyPage, AuthPage, PortalPickerPage } from "./pages/public";
import { DashboardRouter } from "./pages/DashboardRouter";
import { Toaster } from "./components/ui/primitives";

export default function App() {
  return (
    <HospitalProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/login" element={<PortalPickerPage />} />
          <Route path="/login/portal/patient" element={<AuthPage portal="patient" />} />
          <Route path="/login/portal/staff" element={<AuthPage portal="staff" />} />
          <Route path="/login/any" element={<AuthPage portal="any" />} />
          <Route path="/dashboard/*" element={<DashboardRouter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </HashRouter>
    </HospitalProvider>
  );
}
