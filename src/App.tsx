//// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from '@/lib/ScrollToTop'; // <-- 1. IMPORTED
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import OnboardingGuard from "@/components/OnboardingGuard";
import { CommunityProvider } from "./context/CommunityContext"; 
import { SocialCountsProvider } from './context/SocialCountsContext';
import { SecureRouteGuard } from './components/SecureRouteGuard';
import SettingsPage from './pages/SettingsPage';
import { Loader2 } from 'lucide-react';
// --- Core Page Imports ---
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

//--FOOTER Imports--
import HelpPage from './pages/Info/Help';
import SupportPage from './pages/Info/Support';
import ReportPage from './pages/Info/Report';
import PrivacyPage from './pages/Info/Privacy';
import TermsPage from './pages/Info/Terms';
import CookiesPage from './pages/Info/Cookies';
import CodeOfConductPage from './pages/Info/CodeOfConduct';

// --- SOCIAL PAGE IMPORTS ---
import Social from "./pages/Social/Social";
import IndustryHub from "./pages/Social/IndustryHub";
import FunctionalSocial from "./pages/Social/FunctionalSocial";
import FunctionalInbox from "./pages/Social/FunctionalInbox";

// --- COMMUNITY IMPORTS ---
import Forums from "./pages/Community/Forums";
import SpaceDetailPage from "./pages/Community/SpaceDetailPage";
import ThreadDetailPage from "./pages/Community/ThreadDetailPage";
import CreateThread from "./pages/Community/CreateThread";
import MembersPage from './pages/Community/MembersPage';

const queryClient = new QueryClient();

// Helper component to render a different component based on authentication status.
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

const App = () => {
  console.log("App component is rendering. Current time:", new Date().toLocaleTimeString());
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop /> {/* <-- 2. (PROBLEM 4 FIX) ADDED HERE */}
          <AuthProvider>
            {/* THIS WRAPPER MAKES THE COUNTS GLOBALLY AVAILABLE */}
            <SocialCountsProvider>
              <Toaster />
              <Sonner />
              
              <CommunityProvider>
                <Routes>
                  {/* --- Core App Routes (Index and Public) --- */}
                  <Route path="/" element={<Index />} />
                  <Route path="/please-verify" element={<PleaseVerify />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/partnerships" element={<Partnerships />} />
                  <Route path="/community" element={<Forums />} /> 
                  <Route path="/industryhub" element={<IndustryHub />} /> 

                  <Route path="/info/help" element={<HelpPage />} />
                  <Route path="/info/support" element={<SupportPage />} />
                  <Route path="/info/report" element={<ReportPage />} />
                  <Route path="/info/privacy" element={<PrivacyPage />} />
                  <Route path="/info/terms" element={<TermsPage />} />
                  <Route path="/info/cookies" element={<CookiesPage />} />
                  <Route path="/info/code-of-conduct" element={<CodeOfConductPage />} />
                  
                  {/* --- Conditionally Rendered Social Route --- */}
                  <Route path="/social" element={<ConditionalRoute AuthComponent={FunctionalSocial} PublicComponent={Social} />} />
                  
                  {/* --- Public Auth Routes (AuthGuard redirects if logged in) --- */}
                  <Route element={<AuthGuard requireAuth={false} />}>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                  </Route>

                  {/* --- Protected Routes (AuthGuard redirects if NOT logged in) --- */}
                  <Route element={<AuthGuard />}>
                    <Route path="/complete-profile" element={<CompleteProfile />} />
                    <Route path="/profile/:userId" element={<ProfilePage />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route path="/inbox" element={ <SecureRouteGuard> <FunctionalInbox /> </SecureRouteGuard> } />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />

                    {/* --- (PROBLEM 5 FIX) ---
                      This route now correctly includes the :spaceId
                    */}
                    <Route path="/community/space/:spaceId/create-thread" element={<CreateThread />} />
                    
                    <Route path="/community/space/:spaceId" element={<SpaceDetailPage />} />
                    <Route path="/community/space/:spaceId/members" element={<MembersPage />} />
                    <Route path="/community/thread/:threadId" element={<ThreadDetailPage />} />
                  </Route>
                  
                  {/* CATCH-ALL "*" ROUTE - MUST BE LAST */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </CommunityProvider>
            </SocialCountsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );            
};

export default App;
