import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth"; // <-- Added back

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider> {/* <-- Added back */}
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <div>
                  <h1>Hello World!</h1>
                  <p>Step 3: AuthProvider is working.</p>
                </div>
              } />
            </Routes>
          </BrowserRouter>
        </AuthProvider> {/* <-- Added back */}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
