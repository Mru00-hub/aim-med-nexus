import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  Heart, 
  Bell, 
  MessageSquare, 
  Users, 
  MessageCircle,
  Menu,
  X,
  Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getLoveCount, incrementLoveCount } from '@/integrations/supabase/engagement';
import { ProfileAvatar } from './ProfileAvatar'; // --- NEW: Import the ProfileAvatar component ---
import { Skeleton } from '@/components/ui/skeleton'; // --- NEW: Import Skeleton for loading state ---

export const Header = () => {
  // --- MODIFIED: Destructure loading from useAuth ---
  const { user, loading } = useAuth();
  const [lovingItCount, setLovingItCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock notification counts
  const notificationCount = 5;
  const socialRequestCount = 3;
  const inboxCount = 7;

  useEffect(() => {
    const fetchInitialCount = async () => {
      const initialCount = await getLoveCount();
      setLovingItCount(initialCount);
    };
    fetchInitialCount();
  }, []);

  const handleLovingItClick = async () => {
    setLovingItCount(prevCount => prevCount + 1);
    await incrementLoveCount();
  };
  
  const headerIcons = [
    // ... your headerIcons array remains unchanged
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-medical">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            {/* ... your logo svg/div remains unchanged ... */}
          </Link>

          {/* --- MODIFIED: Cleaned up Desktop Navigation --- */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {/* Loving it & Partnerships buttons */}
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={handleLovingItClick} className="relative p-3 hover:bg-muted/50 transition-colors text-destructive hover:text-destructive/80" title="Loving it">
                <Heart className="h-5 w-5" />
                {lovingItCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{lovingItCount > 99 ? '99+' : lovingItCount}</Badge>}
              </Button>
            </div>
            <Link to="/partnerships">
              <Button variant="ghost" size="sm" className="relative p-3 hover:bg-muted/50 transition-colors text-accent hover:text-accent/80" title="Partnerships">
                <Handshake className="h-5 w-5" />
              </Button>
            </Link>

            {/* --- NEW: Unified Auth Section --- */}
            {loading ? (
              <Skeleton className="h-10 w-28 rounded-md" />
            ) : user ? (
              <>
                {headerIcons.map((item, index) => (
                  <div key={index} className="relative">
                    <Link to={item.href || '#'}>
                      <Button variant="ghost" size="sm" className={`relative p-3 hover:bg-muted/50 transition-colors ${item.color}`} title={item.label}>
                        <item.icon className="h-5 w-5" />
                        {item.showBadge && item.badge > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{item.badge > 99 ? '99+' : item.badge}</Badge>}
                      </Button>
                    </Link>
                  </div>
                ))}
                <ProfileAvatar />
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="btn-medical">
                  <Link to="/register">Join Now</Link>
                </Button>
              </div>
            )}
          </div>
          
          {/* --- REMOVED: Redundant Sign Out button is gone, now handled by ProfileAvatar --- */}

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* --- MODIFIED: Fixed Mobile Menu --- */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="grid grid-cols-3 gap-4 p-4">
              {/* Common items */}
              {/* ... your Loving it and Partnerships buttons for mobile ... */}

              {/* Conditional rendering for user state */}
              {user ? (
                headerIcons.map((item, index) => (
                  <div key={index} className="relative">
                    <Link to={item.href || '#'} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className={`w-full flex flex-col items-center gap-1 p-3 h-auto ${item.color}`}>
                        <div className="relative">
                          <item.icon className="h-5 w-5" />
                          {item.showBadge && item.badge > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">{item.badge > 99 ? '99+' : item.badge}</Badge>}
                        </div>
                        <span className="text-xs text-center">{item.label}</span>
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                // --- NEW: This block fixes the bug for logged-out mobile users ---
                <div className="col-span-3 flex items-center justify-center gap-4 py-4">
                   <Button asChild variant="outline" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Link to="/login">Sign In</Link>
                    </Button>
                    <Button asChild className="btn-medical flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Link to="/register">Join Now</Link>
                    </Button>
                </div>
              )}
            </div>
            
            {/* --- NEW: Show Profile/Sign Out in Mobile Menu Footer --- */}
            {user && (
              <div className="border-t border-border p-4 flex justify-center">
                 <ProfileAvatar />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};     
