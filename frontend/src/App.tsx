import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UploadPage } from "./pages/documents/UploadPage";
import { ResultPage } from "./pages/documents/ResultPage";
import { PlansPage } from "./pages/plans/PlansPage";
import { PaymentMethodsPage } from "./pages/billing/PaymentMethodsPage";
import { InvoicesPage } from "./pages/billing/InvoicesPage";
import { ProfilePage } from "./pages/account/ProfilePage";
import { ApiKeysPage } from "./pages/account/ApiKeysPage";
import { TemplatesListPage } from "./pages/templates/TemplatesListPage";
import { TemplateCreatePage } from "./pages/templates/TemplateCreatePage";
import { TemplateEditPage } from "./pages/templates/TemplateEditPage";
import { BatchUploadPage } from "./pages/batches/BatchUploadPage";
import { BatchListPage } from "./pages/batches/BatchListPage";
import { BatchDetailPage } from "./pages/batches/BatchDetailPage";
import { ArcoIdentityPage } from "./pages/arco/ArcoIdentityPage";
import { ArcoRightSelectorPage } from "./pages/arco/ArcoRightSelectorPage";
import { ArcoAccessPage } from "./pages/arco/ArcoAccessPage";
import { ArcoRectificationPage } from "./pages/arco/ArcoRectificationPage";
import { ArcoCancellationPage } from "./pages/arco/ArcoCancellationPage";
import { ArcoOppositionPage } from "./pages/arco/ArcoOppositionPage";
import { ArcoTrackingPage } from "./pages/arco/ArcoTrackingPage";
import { AdminTemplateDraftsPage } from "./pages/admin/AdminTemplateDraftsPage";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/documents/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
        <Route path="/documents/:documentId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="/plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
        <Route path="/billing/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
        <Route path="/billing/invoices" element={<ProtectedRoute><InvoicesPage /></ProtectedRoute>} />
        <Route path="/account/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/account/api-keys" element={<ProtectedRoute><ApiKeysPage /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><TemplatesListPage /></ProtectedRoute>} />
        <Route path="/templates/new" element={<ProtectedRoute><TemplateCreatePage /></ProtectedRoute>} />
        <Route path="/templates/:templateId/edit" element={<ProtectedRoute><TemplateEditPage /></ProtectedRoute>} />
        <Route path="/batches" element={<ProtectedRoute><BatchListPage /></ProtectedRoute>} />
        <Route path="/batches/upload" element={<ProtectedRoute><BatchUploadPage /></ProtectedRoute>} />
        <Route path="/batches/:batchId" element={<ProtectedRoute><BatchDetailPage /></ProtectedRoute>} />
        <Route path="/admin/templates/drafts" element={<ProtectedRoute requireAdmin><AdminTemplateDraftsPage /></ProtectedRoute>} />

        {/* Portal ARCO: público, sin autenticación de sesión (HU 3.2) */}
        <Route path="/arco/identificacion" element={<ArcoIdentityPage />} />
        <Route path="/arco/derecho" element={<ArcoRightSelectorPage />} />
        <Route path="/arco/acceso" element={<ArcoAccessPage />} />
        <Route path="/arco/rectificacion" element={<ArcoRectificationPage />} />
        <Route path="/arco/cancelacion" element={<ArcoCancellationPage />} />
        <Route path="/arco/oposicion" element={<ArcoOppositionPage />} />
        <Route path="/arco/seguimiento" element={<ArcoTrackingPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
