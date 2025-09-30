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
import { Skeleton } from '@/components/ui/skeleton';
import { getLoveCount, incrementLoveCount } from '@/integrations/supabase/engagement';
import { ProfileAvatar } from './ProfileAvatar';

/**
 * AIMedNet Header Component
 * Clean, standard header with conditional features based on auth state
 * Features: Logo, loving it counter, partnerships, navigation icons, profile management
 */
export const Header = () => {
  const { user, loading } = useAuth();
  const [lovingItCount, setLovingItCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock notification counts - replace with real data from your API
  const notificationCount = 5;
  const socialRequestCount = 3;
  const inboxCount = 7;

  // Fetch initial loving it count
  useEffect(() => {
    console.log('useEffect running - fetching love count');
    const fetchInitialCount = async () => {
      const initialCount = await getLoveCount();
      console.log('Love count from database:', initialCount);
      setLovingItCount(initialCount);
    };
    fetchInitialCount();
  }, []);
  // Handle loving it click
  const handleLovingItClick = async () => {
    setLovingItCount(prevCount => prevCount + 1);
    await incrementLoveCount();
  };
  console.log('Current lovingItCount state:', lovingItCount);
  // Navigation icons - only shown to logged-in users
  const headerIcons = [
    {
      icon: Bell,
      label: 'Notifications',
      href: '/notifications',
      showBadge: true,
      badge: notificationCount,
      color: 'text-warning hover:text-warning/80'
    },
    {
      icon: MessageSquare,
      label: 'Feedback',
      href: '/feedback',
      showBadge: false,
      color: 'text-success hover:text-success/80'
    },
    {
      icon: Users,
      label: 'Social',
      href: '/social',
      showBadge: true,
      badge: socialRequestCount,
      color: 'text-primary hover:text-primary/80'
    },
    {
      icon: MessageCircle,
      label: 'Inbox',
      href: '/inbox',
      showBadge: true,
      badge: inboxCount,
      color: 'text-premium hover:text-premium/80'
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-medical">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-medical relative">
              {/* Healthcare Cross Symbol */}
              <div className="w-6 h-6 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-1 bg-primary-foreground rounded-sm"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-4 bg-primary-foreground rounded-sm"></div>
                </div>
                {/* Network dots */}
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
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            
            {/* Global Features - Always Visible */}
            <div className="flex items-center space-x-4 lg:space-x-6">
              {/* Loving It Counter */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLovingItClick}
                className="relative p-3 hover:bg-muted/50 transition-colors text-destructive hover:text-destructive/80"
                title="Loving it"
              >
                <Heart className="h-5 w-5" />
                {lovingItCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {lovingItCount > 99 ? '99+' : lovingItCount}
                  </Badge>
                )}
              </Button>
              
              {/* Partnerships */}
              <Link to="/partnerships">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-3 hover:bg-muted/50 transition-colors text-accent hover:text-accent/80"
                  title="Partnerships"
                >
                  <Handshake className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Conditional Section - Auth-based */}
            {loading ? (
              <Skeleton className="h-10 w-32 rounded-md" />
            ) : user ? (
              // Logged-in users: Navigation icons + Profile Avatar
              <div className="flex items-center space-x-4 lg:space-x-6">
                {headerIcons.map((item, index) => (
                  <div key={index} className="relative">
                    <Link to={item.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`relative p-3 hover:bg-muted/50 transition-colors ${item.color}`}
                        title={item.label}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.showBadge && item.badge > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  </div>
                ))}
                <ProfileAvatar />
              </div>
            ) : (
              // Logged-out users: Sign In + Join Now buttons
              <div className="flex items-center space-x-3">
                <Button asChild variant="outline" size="sm">
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="btn-medical">
                  <Link to="/register">Join Now</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="p-4">
              
              {/* Global Features - Always Visible in Mobile */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Loving It */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleLovingItClick();
                    setMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 p-3 h-auto text-destructive hover:text-destructive/80"
                >
                  <div className="relative">
                    <Heart className="h-5 w-5" />
                    {lovingItCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {lovingItCount > 99 ? '99+' : lovingItCount}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs">Loving it</span>
                </Button>
                
                {/* Partnerships */}
                <Link to="/partnerships" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex flex-col items-center gap-1 p-3 h-auto text-accent hover:text-accent/80"
                  >
                    <Handshake className="h-5 w-5" />
                    <span className="text-xs">Partnerships</span>
                  </Button>
                </Link>
              </div>

              {/* Conditional Mobile Content */}
              {loading ? (
                <div className="flex justify-center py-4">
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ) : user ? (
                // Logged-in users: Navigation icons
                <>
                  <div className="grid grid-cols-3 gap-3">
                    {headerIcons.map((item, index) => (
                      <Link key={index} to={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-full flex flex-col items-center gap-1 p-3 h-auto ${item.color}`}
                        >
                          <div className="relative">
                            <item.icon className="h-5 w-5" />
                            {item.showBadge && item.badge > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                              >
                                {item.badge > 99 ? '99+' : item.badge}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs">{item.label}</span>
                        </Button>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Profile Section at Bottom */}
                  <div className="mt-4 pt-4 border-t border-border flex justify-center">
                    <ProfileAvatar />
                  </div>
                </>
              ) : (
                // Logged-out users: Auth buttons
                <div className="flex flex-col gap-3">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button 
                    asChild 
                    className="btn-medical w-full" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/register">Join Now</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
