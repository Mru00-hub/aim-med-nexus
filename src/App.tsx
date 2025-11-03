//// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// ✅ 1. Replaced BrowserRouter with HashRouter for Cloud Shell compatibility
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from '@/lib/ScrollToTop';
import { AuthProvider, useAuth } from "@/hooks/useAuth"; // useAuth is now used
import AuthGuard from "@/components/AuthGuard";
// import OnboardingGuard from "@/components/OnboardingGuard"; // (This import wasn't used)
import { CommunityProvider } from "./context/CommunityContext"; 
import { SocialCountsProvider } from './context/SocialCountsContext';
import { SecureRouteGuard } from './components/SecureRouteGuard';
import SettingsPage from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import './App.css';
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
console.log('workerSrc (global setup):', pdfjs.GlobalWorkerOptions.workerSrc);

// --- All Page Imports (remain the same) ---
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import Partnerships from "./pages/Partnerships";
import Feedback from "./pages/Feedback";
import Notifications from "./pages/Notifications";
import Register from "./pages/Register";
import Login from "./pages/Login";
import PleaseVerify from "./pages/PleaseVerify";
import PaymentPage from "./pages/PaymentPage";
import NotFound from "./pages/NotFound";
import ProfilePage from './pages/ProfilePage';
import CompleteProfile from "./pages/CompleteProfile";
import AuthCallback from './pages/AuthCallback'; 
import AdminDashboard from './pages/AdminDashboard';
import HelpPage from './pages/Info/Help';
import SupportPage from './pages/Info/Support';
import ReportPage from './pages/Info/Report';
import PrivacyPage from './pages/Info/Privacy';
import TermsPage from './pages/Info/Terms';
import CookiesPage from './pages/Info/Cookies';
import CodeOfConductPage from './pages/Info/CodeOfConduct';
import Social from "./pages/Social/Social";
import IndustryHub from "./pages/IndustryHub/IndustryHub";
import CompanyProfilePage from './pages/IndustryHub/CompanyProfilePage';
import FunctionalSocial from "./pages/Social/FunctionalSocial";
import FunctionalInbox from "./pages/Social/FunctionalInbox";
import Forums from "./pages/Community/Forums";
import SpaceDetailPage from "./pages/Community/SpaceDetailPage";
import ThreadDetailPage from "./pages/Community/ThreadDetailPage";
import CreateThread from "./pages/Community/CreateThread";
import CreatePostPage from "./pages/Community/CreatePostPage";
import MembersPage from './pages/Community/MembersPage';

const queryClient = new QueryClient();

// Helper component (remains the same)
const ConditionalRoute = ({ AuthComponent, PublicComponent }: { AuthComponent: React.ComponentType, PublicComponent: React.ComponentType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return user ? <AuthComponent /> : <PublicComponent />;
};

// ✅ 2. NEW COMPONENT to wrap providers and routes
// This allows us to call useAuth() and get the user ID
const AppContent = () => {
  const { user } = useAuth();

  return (
    // ✅ 3. THE KEY FIX
    // When the user.id changes (or user becomes null), React will
    // destroy and re-create this component and all its children.
    // This 100% clears all old state and subscriptions.
    <SocialCountsProvider key={user ? user.id : 'logged-out'}>
      <Toaster />
      <Sonner />
      
      <CommunityProvider>
        <Routes>
          {/* All routes are now inside AppContent */}
          <Route path="/" element={<Index />} />
          <Route path="/please-verify" element={<PleaseVerify />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/partnerships" element={<Partnerships />} />
          <Route path="/community" element={<Forums />} /> 
          <Route path="/industryhub" element={<IndustryHub />} /> 
          <Route path="/industryhub/company/example" element={<CompanyProfilePage />} />

          <Route path="/info/help" element={<HelpPage />} />
          <Route path="/info/support" element={<SupportPage />} />
          <Route path="/info/report" element={<ReportPage />} />
          <Route path="/info/privacy" element={<PrivacyPage />} />
          <Route path="/info/terms" element={<TermsPage />} />
          <Route path="/info/cookies" element={<CookiesPage />} />
          <Route path="/info/code-of-conduct" element={<CodeOfConductPage />} />
          
          <Route path="/social" element={<ConditionalRoute AuthComponent={FunctionalSocial} PublicComponent={Social} />} />
          
          <Route element={<AuthGuard requireAuth={false} />}>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<AuthGuard />}>
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/inbox" element={ <SecureRouteGuard> <FunctionalInbox /> </SecureRouteGuard> } />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/community/create-post" element={<CreatePostPage />} />
            <Route path="/community/space/:spaceId/create-post" element={<CreatePostPage />} />
            <Route path="/community/space/:spaceId" element={<SpaceDetailPage />} />
            <Route path="/community/space/:spaceId/members" element={<MembersPage />} />
            <Route path="/community/thread/:threadId" element={<ThreadDetailPage />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CommunityProvider>
    </SocialCountsProvider>
  );
}

const App = () => {
  console.log("App component is rendering. Current time:", new Date().toLocaleTimeString());
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* ✅ 4. Using HashRouter */}
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            {/* ✅ 5. Render the new AppContent component */}
            <AppContent />
          </AuthProvider>
          <Analytics />
          <SpeedInsights />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );            
};

export default App;
