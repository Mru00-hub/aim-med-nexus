// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
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
// --- NEW: Import for the Simple Registration Test page ---
import SimpleRegisterTest from "./pages/SimpleRegisterTest";
import ProfilePage from './pages/ProfilePage';
import CompleteProfile from "./pages/CompleteProfile";
import AuthCallback from "./pages/AuthCallback";

// --- UPDATED COMMUNITY IMPORTS ---
// We now only import the components we are actually using.
// Note the correct path casing: pages/Community
import Forums from "./pages/Community/Forums";
import SpaceDetailPage from "./pages/Community/SpaceDetailPage";
import ThreadDetailPage from "./pages/Community/ThreadDetailPage";
import CreateThread from "./pages/Community/CreateThread";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
        
          <Routes>
            {/* --- Core App Routes --- */}
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<AuthGuard requireAuth={false}><Register /></AuthGuard>} />
            <Route path="/please-verify" element={<PleaseVerify />} />
            <Route path="/login" element={<AuthGuard requireAuth={false}><Login /></AuthGuard>} />
            <Route path="/auth/callback" element={<AuthGuard><AuthCallback /></AuthGuard>} />
            <Route path="/complete-profile" element={<AuthGuard><CompleteProfile /></AuthGuard>} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            
            {/* --- Other Feature Routes --- */}
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/networking" element={<Networking />} />
            <Route path="/partnerships" element={<Partnerships />} />
            <Route path="/feedback" element={<AuthGuard><Feedback /></AuthGuard>} />
            <Route path="/social" element={<AuthGuard><Social /></AuthGuard>} />
            <Route path="/inbox" element={<AuthGuard><Inbox /></AuthGuard>} />
            <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
            <Route path="/payment" element={<AuthGuard><PaymentPage /></AuthGuard>} />

            {/* === REVISED AND CLEANED COMMUNITY ROUTES === */}
            {/* All community features now live under the /community path for consistency. */}

            {/* The main discovery page */}
            <Route path="/community" element={<Forums />} />

            {/* Page for creating a new PUBLIC thread */}
            <Route path="/community/create-thread" element={<AuthGuard><CreateThread /></AuthGuard>} />
            
            {/* Page for viewing a specific Forum or Community Space and its threads */}
            <Route path="/community/space/:spaceId" element={<AuthGuard><SpaceDetailPage /></AuthGuard>} />
            
            {/* Page for viewing a single thread's chat interface */}
            <Route path="/community/thread/:threadId" element={<AuthGuard><ThreadDetailPage /></AuthGuard>} />

            {/* --- NEW: Route for the Simple Registration Test --- */}
            {/* This is a temporary route for debugging the registration issue. */}
            <Route path="/simple-test" element={<SimpleRegisterTest />} />
            
            {/* CATCH-ALL "*" ROUTE - MUST BE LAST */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
