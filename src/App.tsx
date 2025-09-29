import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";

// --- Start of page imports ---
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// import Forums from "./pages/Forums";
// import Jobs from "./pages/Jobs";
// import Networking from "./pages/Networking";
// import Partnerships from "./pages/Partnerships";
// import Feedback from "./pages/Feedback";
// import Social from "./pages/Social";
// import Inbox from "./pages/Inbox";
// import Notifications from "./pages/Notifications";
// import Register from "./pages/Register";
// import Login from "./pages/Login";
// import PaymentPage from "./pages/PaymentPage";
// import CreateThread from "./pages/CreateThread";
// import ThreadPage from "./pages/ThreadPage";
// --- End of page imports ---

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />

            {/* --- Temporarily commented out routes --- */}
            {/* <Route path="/forums" element={<Forums />} /> */}
            {/* <Route path="/create-thread" element={<AuthGuard><CreateThread /></AuthGuard>} /> */}
            {/* <Route path="/thread/:threadId" element={<AuthGuard><ThreadPage /></AuthGuard>} /> */}
            {/* <Route path="/jobs" element={<Jobs />} /> */}
            {/* <Route path="/networking" element={<Networking />} /> */}
            {/* <Route path="/partnerships" element={<Partnerships />} /> */}
            {/* <Route path="/feedback" element={<AuthGuard><Feedback /></AuthGuard>} /> */}
            {/* <Route path="/social" element={<AuthGuard><Social /></AuthGuard>} /> */}
            {/* <Route path="/inbox" element={<AuthGuard><Inbox /></AuthGuard>} /> */}
            {/* <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} /> */}
            {/* <Route path="/register" element={<AuthGuard requireAuth={false}><Register /></AuthGuard>} /> */}
            {/* <Route path="/login" element={<AuthGuard requireAuth={false}><Login /></AuthGuard>} /> */}
            {/* <Route path="/payment" element={<AuthGuard><PaymentPage /></AuthGuard>} /> */}
            {/* --- End of commented out routes --- */}

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
