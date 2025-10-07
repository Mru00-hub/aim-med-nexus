// src/components/layout/Header.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Bell, MessageSquare, Users, MessageCircle, Menu, X, Handshake, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getLoveCount, incrementLoveCount } from '@/integrations/supabase/engagement';
import { ProfileAvatar } from './ProfileAvatar';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading placeholders

export const Header = () => {
  // --- CHANGE: Get the 'loading' state from useAuth ---
  const { user, loading } = useAuth();
  const [lovingItCount, setLovingItCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock data remains the same
  const MOCK_DATA = { notificationCount: 5, socialRequestCount: 3, inboxCount: 7 };
  const { notificationCount, socialRequestCount, inboxCount } = MOCK_DATA;

  useEffect(() => {
    getLoveCount().then(setLovingItCount);
    // ... rest of the useEffect is unchanged
  }, []);

  const handleLovingItClick = async () => {
    setLovingItCount(prev => prev + 1);
    await incrementLoveCount();
  };

  const headerIcons = [
    // ... unchanged
  ];

  const renderAuthContent = () => {
    // --- NEW: This function handles the logic for showing skeletons or real content ---
    if (loading) {
      // While auth is loading, show skeletons
      return (
        <>
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full ml-4" />
        </>
      );
    }

    if (user) {
      // If loading is done and user exists, show logged-in content
      return (
        <>
          {headerIcons.map((item, index) => (
            <Link key={index} to={item.href || '#'}>
              <Button variant="ghost" size="sm" className={`relative p-3 ${item.color}`} title={item.label}>
                <item.icon className="h-5 w-5" />
                {item.showBadge && item.badge > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{item.badge > 99 ? '99+' : item.badge}</Badge>}
              </Button>
            </Link>
          ))}
          <div className="ml-4">
            <ProfileAvatar />
          </div>
        </>
      );
    }

    // If loading is done and no user, show logged-out content
    return (
      <div className="flex items-center space-x-2 ml-4">
        <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
        <Link to="/register"><Button size="sm" className="btn-medical">Join Now</Button></Link>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between">
          {/* Logo (unchanged) */}
          <Link to="/" className="flex items-center space-x-3">
            {/* ... logo JSX ... */}
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary">AIMedNet</span>
              <span className="text-xs text-muted-foreground hidden sm:block">Healthcare Professionals</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {/* Loving It & Partnerships buttons (unchanged) */}
            <Button variant="ghost" size="sm" onClick={handleLovingItClick} className="relative p-3 text-destructive hover:text-destructive/80" title="Loving it">
              <Heart className="h-5 w-5" />
              {lovingItCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">{lovingItCount > 99 ? '99+' : lovingItCount}</Badge>}
            </Button>
            <Link to="/partnerships"><Button variant="ghost" size="sm" className="p-3 text-accent"><Handshake className="h-5 w-5" /></Button></Link>

            {/* --- CHANGE: Replaced direct logic with our new render function --- */}
            {renderAuthContent()}
          </div>

          {/* Mobile Menu Button (unchanged) */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu (logic can also be updated to use loading state, but this is the main fix) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background pb-4">
            {/* ... mobile menu JSX unchanged for now ... */}
          </div>
        )}
      </div>
    </header>
  );
};
