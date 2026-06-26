import { Routes, Route, Navigate } from "react-router-dom";
import { useHospital } from "../lib/store";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import {
  SuperAdminOverview, AdminOverview, DoctorOverview, LabTechOverview,
  PharmacistOverview, PatientOverview,
} from "./dashboards";
import {
  UsersSection, PatientsList, PatientDetail, DoctorsList, DoctorDetail,
  DepartmentsSection, LabResultsSection, LabUpload, LabTechUploads,
  AmbulanceSection, DrugsSection, LowStockSection, TreatmentsSection,
  NotificationsSection, AuditSection, SettingsSection, MyDoctorSection,
  ProfileSection,
} from "./sections";
import { SanityCmsPage } from "./sanityCms";

function RootRoute() {
  const { currentUser } = useHospital();
  if (!currentUser) return <Navigate to="/login" replace />;
  switch (currentUser.role) {
    case "super_admin": return <SuperAdminOverview />;
    case "admin": return <AdminOverview />;
    case "doctor": return <DoctorOverview />;
    case "lab_tech": return <LabTechOverview />;
    case "pharmacist": return <PharmacistOverview />;
    case "patient": return <PatientOverview />;
    default: return <Navigate to="/login" replace />;
  }
}

export function DashboardRouter() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/users" element={<UsersSection />} />
        <Route path="/patients" element={<PatientsList />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/doctors" element={<DoctorsList />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />
        <Route path="/departments" element={<DepartmentsSection />} />
        <Route path="/lab-results" element={<LabResultsSection />} />
        <Route path="/upload" element={<LabUpload />} />
        <Route path="/uploads" element={<LabTechUploads />} />
        <Route path="/treatments" element={<TreatmentsSection />} />
        <Route path="/ambulance" element={<AmbulanceSection />} />
        <Route path="/drugs" element={<DrugsSection />} />
        <Route path="/cms" element={<SanityCmsPage />} />
        <Route path="/low-stock" element={<LowStockSection />} />
        <Route path="/notifications" element={<NotificationsSection />} />
        <Route path="/audit" element={<AuditSection />} />
        <Route path="/settings" element={<SettingsSection />} />
        <Route path="/doctor" element={<MyDoctorSection />} />
        <Route path="/profile" element={<ProfileSection />} />
      </Routes>
    </DashboardLayout>
  );
}
