import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { FacilityProvider } from "@/contexts/FacilityContext";
import { ShiftProvider } from "@/contexts/ShiftContext";
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
import ForgotPassword from "./pages/ForgotPassword";
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
import Operations from "./pages/Operations";
import AboveSiteDashboard from "./pages/AboveSiteDashboard";
import SharedSummary from "./pages/SharedSummary";
import Telemedicine from "./pages/Telemedicine";
import PatientSorting from "./pages/PatientSorting";
import Discharge from "./pages/Discharge";
import WorkspaceManagement from "./pages/WorkspaceManagement";
import Landela from "./pages/Landela";
import TshepoConsentAdmin from "./pages/admin/TshepoConsentAdmin";
import TshepoAuditSearch from "./pages/admin/TshepoAuditSearch";
import TshepoBreakGlass from "./pages/admin/TshepoBreakGlass";
import TshepoPatientAccessHistory from "./pages/admin/TshepoPatientAccessHistory";
import TshepoOfflineStatus from "./pages/admin/TshepoOfflineStatus";
import VitoPatients from "./pages/admin/VitoPatients";
import VitoMergeQueue from "./pages/admin/VitoMergeQueue";
import VitoEventsViewer from "./pages/admin/VitoEventsViewer";
import VitoAuditViewer from "./pages/admin/VitoAuditViewer";
import TusoFacilities from "./pages/admin/TusoFacilities";
import TusoWorkspaces from "./pages/admin/TusoWorkspaces";
import TusoStartShift from "./pages/admin/TusoStartShift";
import TusoResources from "./pages/admin/TusoResources";
import TusoConfig from "./pages/admin/TusoConfig";
import TusoControlTower from "./pages/admin/TusoControlTower";
import VarapiProviders from "./pages/admin/VarapiProviders";
import VarapiPrivileges from "./pages/admin/VarapiPrivileges";
import VarapiCouncils from "./pages/admin/VarapiCouncils";
import VarapiTokens from "./pages/admin/VarapiTokens";
import VarapiPortal from "./pages/admin/VarapiPortal";
import ButanoTimeline from "./pages/admin/ButanoTimeline";
import ButanoIPS from "./pages/admin/ButanoIPS";
import ButanoVisitSummary from "./pages/admin/ButanoVisitSummary";
import ButanoReconciliation from "./pages/admin/ButanoReconciliation";
import ButanoStats from "./pages/admin/ButanoStats";
import SuiteDocsConsole from "./pages/admin/SuiteDocsConsole";
import SuiteSelfService from "./pages/admin/SuiteSelfService";
import PctWorkTab from "./pages/admin/PctWorkTab";
import PctControlTower from "./pages/admin/PctControlTower";
import ZiboAdmin from "./pages/admin/ZiboAdmin";
import OrosAdmin from "./pages/admin/OrosAdmin";
import PharmacyAdmin from "./pages/admin/PharmacyAdmin";
import InventoryAdmin from "./pages/admin/InventoryAdmin";
import MsikaCoreAdmin from "./pages/admin/MsikaCoreAdmin";
import MsikaFlowAdmin from "./pages/admin/MsikaFlowAdmin";
import CostaAdmin from "./pages/admin/CostaAdmin";
import MushexAdmin from "./pages/admin/MushexAdmin";
import IndawoAdmin from "./pages/admin/IndawoAdmin";
import UbomiAdmin from "./pages/admin/UbomiAdmin";
import PublicHealthOps from "./pages/PublicHealthOps";
import CoverageOperations from "./pages/CoverageOperations";
import AIGovernance from "./pages/AIGovernance";
import OmnichannelHub from "./pages/OmnichannelHub";
import FacilityMode from "./pages/FacilityMode";
import RegistryAdmin from "./pages/RegistryAdmin";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FacilityProvider>
        <WorkspaceProvider>
        <ShiftProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
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
            <Route path="/operations" element={
              <ProtectedRoute>
                <Operations />
              </ProtectedRoute>
            } />
            <Route path="/above-site" element={
              <ProtectedRoute>
                <AboveSiteDashboard />
              </ProtectedRoute>
            } />
            <Route path="/telemedicine" element={
              <ProtectedRoute>
                <Telemedicine />
              </ProtectedRoute>
            } />
            <Route path="/sorting" element={
              <ProtectedRoute>
                <PatientSorting />
              </ProtectedRoute>
            } />
            <Route path="/discharge" element={
              <ProtectedRoute>
                <Discharge />
              </ProtectedRoute>
            } />
            <Route path="/workspace-management" element={
              <ProtectedRoute>
                <WorkspaceManagement />
              </ProtectedRoute>
            } />
            <Route path="/landela" element={
              <ProtectedRoute>
                <Landela />
              </ProtectedRoute>
            } />
            {/* Shared Summary Routes - publicly accessible with valid token */}
            <Route path="/shared/:type/:token" element={<SharedSummary />} />
            {/* TSHEPO Trust Layer Admin Surfaces */}
            <Route path="/admin/tshepo/consents" element={<ProtectedRoute><TshepoConsentAdmin /></ProtectedRoute>} />
            <Route path="/admin/tshepo/audit" element={<ProtectedRoute><TshepoAuditSearch /></ProtectedRoute>} />
            <Route path="/admin/tshepo/breakglass" element={<ProtectedRoute><TshepoBreakGlass /></ProtectedRoute>} />
            <Route path="/admin/tshepo/access-history" element={<ProtectedRoute><TshepoPatientAccessHistory /></ProtectedRoute>} />
            <Route path="/admin/tshepo/offline" element={<ProtectedRoute><TshepoOfflineStatus /></ProtectedRoute>} />
            {/* VITO v1.1 Admin Surfaces */}
            <Route path="/admin/vito/patients" element={<ProtectedRoute><VitoPatients /></ProtectedRoute>} />
            <Route path="/admin/vito/merges" element={<ProtectedRoute><VitoMergeQueue /></ProtectedRoute>} />
            <Route path="/admin/vito/events" element={<ProtectedRoute><VitoEventsViewer /></ProtectedRoute>} />
            <Route path="/admin/vito/audit" element={<ProtectedRoute><VitoAuditViewer /></ProtectedRoute>} />
            {/* TUSO Admin Surfaces */}
            <Route path="/admin/tuso/facilities" element={<ProtectedRoute><TusoFacilities /></ProtectedRoute>} />
            <Route path="/admin/tuso/workspaces" element={<ProtectedRoute><TusoWorkspaces /></ProtectedRoute>} />
            <Route path="/admin/tuso/start-shift" element={<ProtectedRoute><TusoStartShift /></ProtectedRoute>} />
            <Route path="/admin/tuso/resources" element={<ProtectedRoute><TusoResources /></ProtectedRoute>} />
            <Route path="/admin/tuso/config" element={<ProtectedRoute><TusoConfig /></ProtectedRoute>} />
            <Route path="/admin/tuso/control-tower" element={<ProtectedRoute><TusoControlTower /></ProtectedRoute>} />
            {/* VARAPI Admin Surfaces */}
            <Route path="/admin/varapi/providers" element={<ProtectedRoute><VarapiProviders /></ProtectedRoute>} />
            <Route path="/admin/varapi/privileges" element={<ProtectedRoute><VarapiPrivileges /></ProtectedRoute>} />
            <Route path="/admin/varapi/councils" element={<ProtectedRoute><VarapiCouncils /></ProtectedRoute>} />
            <Route path="/admin/varapi/tokens" element={<ProtectedRoute><VarapiTokens /></ProtectedRoute>} />
            <Route path="/admin/varapi/portal" element={<ProtectedRoute><VarapiPortal /></ProtectedRoute>} />
            {/* BUTANO SHR Surfaces */}
            <Route path="/admin/butano/timeline" element={<ProtectedRoute><ButanoTimeline /></ProtectedRoute>} />
            <Route path="/admin/butano/ips" element={<ProtectedRoute><ButanoIPS /></ProtectedRoute>} />
            <Route path="/admin/butano/visit-summary" element={<ProtectedRoute><ButanoVisitSummary /></ProtectedRoute>} />
            <Route path="/admin/butano/reconciliation" element={<ProtectedRoute><ButanoReconciliation /></ProtectedRoute>} />
            <Route path="/admin/butano/stats" element={<ProtectedRoute><ButanoStats /></ProtectedRoute>} />
            {/* Landela + Credentials Suite Surfaces */}
            <Route path="/admin/suite/docs" element={<ProtectedRoute><SuiteDocsConsole /></ProtectedRoute>} />
            <Route path="/admin/suite/portal" element={<ProtectedRoute><SuiteSelfService /></ProtectedRoute>} />
            {/* PCT v1.1 Surfaces */}
            <Route path="/admin/pct/work" element={<ProtectedRoute><PctWorkTab /></ProtectedRoute>} />
            <Route path="/admin/pct/control-tower" element={<ProtectedRoute><PctControlTower /></ProtectedRoute>} />
            {/* ZIBO Terminology Service */}
            <Route path="/admin/zibo" element={<ProtectedRoute><ZiboAdmin /></ProtectedRoute>} />
            {/* OROS Orders & Results */}
            <Route path="/admin/oros" element={<ProtectedRoute><OrosAdmin /></ProtectedRoute>} />
            {/* Pharmacy Service */}
            <Route path="/admin/pharmacy" element={<ProtectedRoute><PharmacyAdmin /></ProtectedRoute>} />
            {/* Inventory & Supply Chain Service */}
            <Route path="/admin/inventory" element={<ProtectedRoute><InventoryAdmin /></ProtectedRoute>} />
            {/* MSIKA Core — Products & Services Registry */}
            <Route path="/admin/msika-core" element={<ProtectedRoute><MsikaCoreAdmin /></ProtectedRoute>} />
            {/* MSIKA Flow — Commerce & Fulfillment */}
            <Route path="/admin/msika-flow" element={<ProtectedRoute><MsikaFlowAdmin /></ProtectedRoute>} />
            {/* COSTA — Costing Engine */}
            <Route path="/admin/costa" element={<ProtectedRoute><CostaAdmin /></ProtectedRoute>} />
            {/* MUSHEX — Payment Switch & Claims */}
            <Route path="/admin/mushex" element={<ProtectedRoute><MushexAdmin /></ProtectedRoute>} />
            {/* INDAWO — Site & Premises Registry */}
            <Route path="/admin/indawo" element={<ProtectedRoute><IndawoAdmin /></ProtectedRoute>} />
            {/* UBOMI — CRVS Interface */}
            <Route path="/admin/ubomi" element={<ProtectedRoute><UbomiAdmin /></ProtectedRoute>} />
            {/* Public Health & Local Authority Operations */}
            <Route path="/public-health" element={<ProtectedRoute><PublicHealthOps /></ProtectedRoute>} />
            {/* Coverage, Financing & Payer Operations */}
            <Route path="/coverage" element={<ProtectedRoute><CoverageOperations /></ProtectedRoute>} />
            {/* AI Governance & Insights */}
            <Route path="/ai-governance" element={<ProtectedRoute><AIGovernance /></ProtectedRoute>} />
            {/* Omnichannel & Experience Hub */}
            <Route path="/omnichannel" element={<ProtectedRoute><OmnichannelHub /></ProtectedRoute>} />
            <Route path="/facility-mode" element={
              <ProtectedRoute>
                <FacilityMode />
              </ProtectedRoute>
            } />
            <Route path="/registry-admin" element={
              <ProtectedRoute>
                <RegistryAdmin />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
        </ShiftProvider>
        </WorkspaceProvider>
      </FacilityProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;