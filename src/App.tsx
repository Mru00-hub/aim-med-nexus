// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import OnboardingGuard from "@/components/OnboardingGuard";
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
import SimpleRegisterTest from "./pages/SimpleRegisterTest";
import ProfilePage from './pages/ProfilePage';
import CompleteProfile from "./pages/CompleteProfile";

// --- UPDATED COMMUNITY IMPORTS ---
// We now only import the components we are actually using.
// Note the correct path casing: pages/Community
import Forums from "./pages/Community/Forums";
import SpaceDetailPage from "./pages/Community/SpaceDetailPage";
import ThreadDetailPage from "./pages/Community/ThreadDetailPage";
import CreateThread from "./pages/Community/CreateThread";

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
        
            <Routes>
              {/* --- Core App Routes --- */}
              <Route path="/" element={<Index />} />
              <Route path="/please-verify" element={<PleaseVerify />} />
              <Route path="/simple-test" element={<SimpleRegisterTest />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/networking" element={<Networking />} />
              <Route path="/partnerships" element={<Partnerships />} />
              <Route path="/community" element={<Forums />} />
              <Route element={<AuthGuard requireAuth={false} />}>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
              </Route>
              <Route element={<AuthGuard />}>
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/feedback" element={<AuthGuard><Feedback />} />
                <Route path="/social" element={<AuthGuard><Social />} />
                <Route path="/inbox" element={<AuthGuard><Inbox />} />
                <Route path="/notifications" element={<AuthGuard><Notifications />} />
                <Route path="/payment" element={<AuthGuard><PaymentPage />} />
                {/* Community Actions */}
                <Route path="/community/create-thread" element={<CreateThread />} />
                <Route path="/community/space/:spaceId" element={<SpaceDetailPage />} />
                <Route path="/community/thread/:threadId" element={<ThreadDetailPage />} />
                {/* Routes that ALSO require the user to be fully onboarded */}
                <Route element={<OnboardingGuard />}>
                  <Route path="/profile" element={<ProfilePage />} />
                  {/* You can add other routes here that need onboarding */}
                </Route>
              </Route>
              {/* CATCH-ALL "*" ROUTE - MUST BE LAST */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );            
};

export default App;
