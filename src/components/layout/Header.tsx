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
  Briefcase,
  Handshake,
  LogIn, // Icon for sign-in
  UserPlus // Icon for join now
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getLoveCount, incrementLoveCount } from '@/integrations/supabase/engagement';
import { ProfileAvatar } from './ProfileAvatar'; // Import the new component

/**
 * AIMedNet Header Component
 * Features: Logo, loving it counter, navigation icons with notifications
 * Real-time counters and notification badges for professional healthcare networking
 */
export const Header = () => {
  const { user } = useAuth();
  const [lovingItCount, setLovingItCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock notification counts
  // For future development, these will be fetched via a custom hook
  const MOCK_DATA = {
    notificationCount: 5,
    socialRequestCount: 3,
    inboxCount: 7,
  };
  // Then use it like this:
  const { notificationCount, socialRequestCount, inboxCount } = MOCK_DATA;

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
  
  const handleResize = () => {
    // The `md` breakpoint in Tailwind is 768px by default
    if (window.innerWidth >= 768) {
      setMobileMenuOpen(false);
    }
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
  }, []);

  const headerIcons = [
    { icon: Bell, label: 'Notifications', href: '/notifications', showBadge: true, badge: notificationCount, color: 'text-warning hover:text-warning/80' },
    { icon: MessageSquare, label: 'Feedback', href: '/feedback', showBadge: false, color: 'text-success hover:text-success/80' },
    { icon: Users, label: 'Social', href: '/social', showBadge: true, badge: socialRequestCount, color: 'text-primary hover:text-primary/80' },
    { icon: MessageCircle, label: 'Inbox', href: '/inbox', showBadge: true, badge: inboxCount, color: 'text-premium hover:text-premium/80' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-medical">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-medical relative">
              <div className="w-6 h-6 relative">
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-1 bg-primary-foreground rounded-sm"></div></div>
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-1 h-4 bg-primary-foreground rounded-sm"></div></div>
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-success rounded-full"></div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary">AIMedNet</span>
              <span className="text-xs text-muted-foreground hidden sm:block">Healthcare Professionals</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {/* Common icons for all users */}
            <Button variant="ghost" size="sm" onClick={handleLovingItClick} className="relative p-3 text-destructive hover:text-destructive/80" title="Loving it">
              <Heart className="h-5 w-5" />
              {lovingItCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{lovingItCount > 99 ? '99+' : lovingItCount}</Badge>}
            </Button>
            <Link to="/partnerships">
              <Button variant="ghost" size="sm" className="relative p-3 text-accent hover:text-accent/80" title="Partnerships">
                <Handshake className="h-5 w-5" />
              </Button>
            </Link>

            {user ? (
              <>
                {headerIcons.map((item, index) => (
                  <Link key={index} to={item.href || '#'}>
                    <Button variant="ghost" size="sm" className={`relative p-3 ${item.color}`} title={item.label}>
                      <item.icon className="h-5 w-5" />
                      {item.showBadge && item.badge > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{item.badge > 99 ? '99+' : item.badge}</Badge>}
                    </Button>
                  </Link>
                ))}
                {/* --- CHANGE: Replaced Sign Out button with ProfileAvatar component --- */}
                <div className="ml-4">
                  <ProfileAvatar />
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
                <Link to="/register"><Button size="sm" className="btn-medical">Join Now</Button></Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background pb-4">
            <div className="grid grid-cols-3 gap-2 p-2">
              {/* Common links for all users */}
              <Button variant="ghost" size="sm" onClick={() => { handleLovingItClick(); setMobileMenuOpen(false); }} className="w-full flex flex-col items-center gap-1 p-2 h-auto text-destructive">
                <div className="relative"><Heart className="h-5 w-5" />{lovingItCount > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center">{lovingItCount}</Badge>}</div><span className="text-xs">Loving it</span>
              </Button>
              <Link to="/partnerships" onClick={() => setMobileMenuOpen(false)} className="block"><Button variant="ghost" size="sm" className="w-full flex flex-col items-center gap-1 p-2 h-auto text-accent"><Handshake className="h-5 w-5" /><span className="text-xs">Partnerships</span></Button></Link>

              {user ? (
                // --- Icons for LOGGED-IN mobile users ---
                headerIcons.map((item, index) => (
                  <Link key={index} to={item.href || '#'} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className={`w-full flex flex-col items-center gap-1 p-2 h-auto ${item.color}`}>
                      <div className="relative"><item.icon className="h-5 w-5" />{item.showBadge && item.badge > 0 && <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center">{item.badge}</Badge>}</div><span className="text-xs text-center">{item.label}</span>
                    </Button>
                  </Link>
                ))
              ) : (
                // --- BUG FIX: Added Sign In / Join Now for LOGGED-OUT mobile users ---
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="ghost" size="sm" className="w-full flex flex-col items-center gap-1 p-2 h-auto">
                      <LogIn className="h-5 w-5" />
                      <span className="text-xs">Sign In</span>
                    </Button>
                  </Link>
                   <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block col-span-2">
                     <Button size="sm" className="w-full btn-medical flex flex-col items-center gap-1 p-2 h-auto">
                       <UserPlus className="h-5 w-5" />
                       <span className="text-xs font-semibold">Join AIMedNet Now</span>
                     </Button>
                   </Link>
                </>
              )}
            </div>
             {/* --- Profile/Sign Out for LOGGED-IN mobile users --- */}
            {user && (
              <div className="border-t border-border mt-2 pt-2 px-2 flex items-center justify-between">
                <ProfileAvatar />
                {/* The Sign Out is inside ProfileAvatar, so we can add other actions here if needed */}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
