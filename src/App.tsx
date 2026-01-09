import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { FacilityProvider } from "@/contexts/FacilityContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import ModuleHome from "./pages/ModuleHome";
import Dashboard from "./pages/Dashboard";
import Encounter from "./pages/Encounter";
import Patients from "./pages/Patients";
import Stock from "./pages/Stock";
import Consumables from "./pages/Consumables";
import Charges from "./pages/Charges";
import Registration from "./pages/Registration";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ProfileSettings from "./pages/ProfileSettings";
import AdminDashboard from "./pages/AdminDashboard";
import Queue from "./pages/Queue";
import Beds from "./pages/Beds";
import Appointments from "./pages/Appointments";
import Pharmacy from "./pages/Pharmacy";
import Theatre from "./pages/Theatre";
import Payments from "./pages/Payments";
import Portal from "./pages/Portal";
import PACS from "./pages/PACS";
import LIMS from "./pages/LIMS";
import Install from "./pages/Install";
import Odoo from "./pages/Odoo";
import Reports from "./pages/Reports";
import Orders from "./pages/Orders";
import Handoff from "./pages/Handoff";
import HelpDesk from "./pages/HelpDesk";
import NotFound from "./pages/NotFound";
import ProductCatalogue from "./pages/ProductCatalogue";
import HealthMarketplace from "./pages/HealthMarketplace";
import ProductManagement from "./pages/admin/ProductManagement";
import PrescriptionFulfillment from "./pages/PrescriptionFulfillment";
import VendorPortal from "./pages/VendorPortal";
import AppointmentScheduling from "./pages/scheduling/AppointmentScheduling";
import TheatreScheduling from "./pages/scheduling/TheatreScheduling";
import ProviderNoticeboard from "./pages/scheduling/ProviderNoticeboard";
import ResourceCalendar from "./pages/scheduling/ResourceCalendar";
import IdServices from "./pages/IdServices";
import Communication from "./pages/Communication";
import Social from "./pages/Social";
import Kiosk from "./pages/Kiosk";
import RegistryManagement from "./pages/RegistryManagement";
import HealthProviderRegistry from "./pages/HealthProviderRegistry";
import FacilityRegistry from "./pages/FacilityRegistry";
import ClientRegistry from "./pages/ClientRegistry";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FacilityProvider>
        <WorkspaceProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={
              <ProtectedRoute>
                <ModuleHome />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/encounter" element={
              <ProtectedRoute>
                <Encounter />
              </ProtectedRoute>
            } />
            <Route path="/encounter/:encounterId" element={
              <ProtectedRoute>
                <Encounter />
              </ProtectedRoute>
            } />
            <Route path="/queue" element={
              <ProtectedRoute>
                <Queue />
              </ProtectedRoute>
            } />
            <Route path="/beds" element={
              <ProtectedRoute>
                <Beds />
              </ProtectedRoute>
            } />
            <Route path="/appointments" element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            } />
            <Route path="/patients" element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            } />
            <Route path="/stock" element={
              <ProtectedRoute>
                <Stock />
              </ProtectedRoute>
            } />
            <Route path="/consumables" element={
              <ProtectedRoute>
                <Consumables />
              </ProtectedRoute>
            } />
            <Route path="/charges" element={
              <ProtectedRoute>
                <Charges />
              </ProtectedRoute>
            } />
            <Route path="/registration" element={
              <ProtectedRoute>
                <Registration />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfileSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/pharmacy" element={
              <ProtectedRoute>
                <Pharmacy />
              </ProtectedRoute>
            } />
            <Route path="/theatre" element={
              <ProtectedRoute>
                <Theatre />
              </ProtectedRoute>
            } />
            <Route path="/payments" element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            } />
            <Route path="/pacs" element={
              <ProtectedRoute>
                <PACS />
              </ProtectedRoute>
            } />
            <Route path="/lims" element={
              <ProtectedRoute>
                <LIMS />
              </ProtectedRoute>
            } />
            <Route path="/portal" element={<Portal />} />
            <Route path="/install" element={<Install />} />
            <Route path="/odoo" element={
              <ProtectedRoute>
                <Odoo />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/handoff" element={
              <ProtectedRoute>
                <Handoff />
              </ProtectedRoute>
            } />
            <Route path="/help" element={
              <ProtectedRoute>
                <HelpDesk />
              </ProtectedRoute>
            } />
            <Route path="/catalogue" element={<ProductCatalogue />} />
            <Route path="/marketplace" element={<HealthMarketplace />} />
            <Route path="/admin/product-registry" element={
              <ProtectedRoute>
                <ProductManagement />
              </ProtectedRoute>
            } />
            <Route path="/fulfillment" element={
              <ProtectedRoute>
                <PrescriptionFulfillment />
              </ProtectedRoute>
            } />
            <Route path="/vendor-portal" element={
              <ProtectedRoute>
                <VendorPortal />
              </ProtectedRoute>
            } />
            <Route path="/scheduling" element={
              <ProtectedRoute>
                <AppointmentScheduling />
              </ProtectedRoute>
            } />
            <Route path="/scheduling/theatre" element={
              <ProtectedRoute>
                <TheatreScheduling />
              </ProtectedRoute>
            } />
            <Route path="/scheduling/noticeboard" element={
              <ProtectedRoute>
                <ProviderNoticeboard />
              </ProtectedRoute>
            } />
            <Route path="/scheduling/resources" element={
              <ProtectedRoute>
                <ResourceCalendar />
              </ProtectedRoute>
            } />
            <Route path="/id-services" element={
              <ProtectedRoute>
                <IdServices />
              </ProtectedRoute>
            } />
            <Route path="/communication" element={
              <ProtectedRoute>
                <Communication />
              </ProtectedRoute>
            } />
            <Route path="/social" element={
              <ProtectedRoute>
                <Social />
              </ProtectedRoute>
            } />
            <Route path="/kiosk" element={<Kiosk />} />
            <Route path="/registry-management" element={
              <ProtectedRoute>
                <RegistryManagement />
              </ProtectedRoute>
            } />
            <Route path="/hpr" element={
              <ProtectedRoute>
                <HealthProviderRegistry />
              </ProtectedRoute>
            } />
            <Route path="/facility-registry" element={
              <ProtectedRoute>
                <FacilityRegistry />
              </ProtectedRoute>
            } />
            <Route path="/client-registry" element={
              <ProtectedRoute>
                <ClientRegistry />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
        </WorkspaceProvider>
      </FacilityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;