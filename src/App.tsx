//src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import OnboardingGuard from "@/components/OnboardingGuard";

// --- NEW CRITICAL IMPORT ---
import { CommunityProvider } from "./context/CommunityContext"; 

// page imports
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import Networking from "./pages/Networking";
import Partnerships from "./pages/Partnerships";
import Feedback from "./pages/Feedback";
import Social from "./pages/Social";
import Inbox from "./pages/Inbox";
import Notifications from "./pages/Notifications";
import Register from "./pages/Register";
import Login from "./pages/Login";
import PleaseVerify from "./pages/PleaseVerify";
import PaymentPage from "./pages/PaymentPage";
import NotFound from "./pages/NotFound";
import ProfilePage from './pages/ProfilePage';
import CompleteProfile from "./pages/CompleteProfile";

// --- UPDATED COMMUNITY IMPORTS ---
import Forums from "./pages/Community/Forums";
import SpaceDetailPage from "./pages/Community/SpaceDetailPage";
import ThreadDetailPage from "./pages/Community/ThreadDetailPage";
import CreateThread from "./pages/Community/CreateThread";
import MembersPage from './pages/Community/MembersPage';

const queryClient = new QueryClient();

const App = () => {
  console.log("App component is rendering. Current time:", new Date().toLocaleTimeString());
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            
            {/* The CommunityProvider wraps routes that use useCommunity hook */}
            <CommunityProvider>
              <Routes>
                {/* --- Core App Routes (Index and Public) --- */}
                <Route path="/" element={<Index />} />
                <Route path="/please-verify" element={<PleaseVerify />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/networking" element={<Networking />} />
                <Route path="/partnerships" element={<Partnerships />} />
                
                {/* NOTE: Forums is the discovery page, it must be inside the provider */}
                <Route path="/community" element={<Forums />} /> 

                {/* --- Public Routes (AuthGuard redirects if logged in) --- */}
                <Route element={<AuthGuard requireAuth={false} />}>
                  <Route path="/register" element={<Register />} />
                  <Route path="/login" element={<Login />} />
                </Route>

                {/* --- Protected Routes (AuthGuard redirects if NOT logged in) --- */}
                <Route element={<AuthGuard />}>
                  <Route path="/complete-profile" element={<CompleteProfile />} />
                  <Route path="/profile/:userId" element={<ProfilePage />} />

                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/payment" element={<PaymentPage />} />

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
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );            
};

export default App;
