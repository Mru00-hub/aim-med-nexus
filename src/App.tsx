// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import OnboardingGuard from "@/components/OnboardingGuard";
import { CommunityProvider } from "./context/CommunityContext"; 
import { SocialCountsProvider } from './context/SocialCountsContext'; // Import the provider

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

// --- SOCIAL PAGE IMPORTS ---
import Social from "./pages/Social/Social";
import Opportunities from "./pages/Social/Opportunities";
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
  const { user } = useAuth();
  return user ? <AuthComponent /> : <PublicComponent />;
};

const App = () => {
  console.log("App component is rendering. Current time:", new Date().toLocaleTimeString());
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
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
                  <Route path="/opportunities" element={<Opportunities />} /> 
                  
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
                    <Route path="/inbox" element={<FunctionalInbox />} />

                    {/* Community Protected Routes */}
                    <Route path="/community/create-thread" element={<CreateThread />} />
                    <Route path="/community/space/:spaceId" element={<SpaceDetailPage />} />
                    <Route path="/community/space/:spaceId/members" element={<MembersPage />} />
                    <Route path="/community/thread/:threadId" element={<ThreadDetailPage />} />
                    
                    {/* Routes that ALSO require the user to be fully onboarded */}
                    <Route element={<OnboardingGuard />}>
                      <Route path="/profile" element={<ProfilePage />} />
                    </Route>
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
