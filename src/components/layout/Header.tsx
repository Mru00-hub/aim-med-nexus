// src/components/layout/Header.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Bell, MessageSquare, Users, MessageCircle, Menu, X, Handshake, LogIn, UserPlus,UserIcon, LogOut, Settings, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getLoveCount, incrementLoveCount } from '@/integrations/supabase/engagement';
import { ProfileAvatar } from './ProfileAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [lovingItCount, setLovingItCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- THIS DATA IS NEEDED FOR THE ICONS ---
  const MOCK_DATA = {
    notificationCount: 5,
    socialRequestCount: 3,
    inboxCount: 7,
  };
  const { notificationCount, socialRequestCount, inboxCount } = MOCK_DATA;

  // --- THIS ARRAY DEFINITION WAS ACCIDENTALLY OMITTED ---
  const headerIcons = [
    { icon: Bell, label: 'Notifications', href: '/notifications', showBadge: true, badge: notificationCount, color: 'text-warning hover:text-warning/80' },
    { icon: MessageSquare, label: 'Feedback', href: '/feedback', showBadge: false, color: 'text-success hover:text-success/80' },
    { icon: Users, label: 'Social', href: '/social', showBadge: true, badge: socialRequestCount, color: 'text-primary hover:text-primary/80' },
    { icon: MessageCircle, label: 'Inbox', href: '/inbox', showBadge: true, badge: inboxCount, color: 'text-premium hover:text-premium/80' }
  ];

  const handleMobileNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    getLoveCount().then(setLovingItCount);
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLovingItClick = async () => {
    setLovingItCount(prevCount => prevCount + 1);
    await incrementLoveCount();
  };

  const renderAuthContent = () => {
    if (loading) {
      // While auth is loading, show skeletons
      return (
        <>
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-full ml-4" />
        </>
      );
    }

    if (user) {
      // If loading is done and user exists, show logged-in content
      return (
        <>
          {headerIcons.map((item) => (
            <Link key={item.label} to={item.href || '#'}>
              <Button variant="ghost" size="sm" className={`relative p-3 ${item.color}`} title={item.label}>
                <item.icon className="h-5 w-5" />
                {item.showBadge && item.badge > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{item.badge > 99 ? '99+' : item.badge}</Badge>}
              </Button>
            </Link>
          ))}
          <div className="ml-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <ProfileAvatar />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      );
    }

    // If loading is done and no user, show logged-out content
    return (
      <div className="flex items-center space-x-2 ml-4">
        <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
        <Link to="/register"><Button size="sm">Join Now</Button></Link>
      </div>
    );
  };

  const renderMobileMenuContent = () => {
    if (loading) {
      return <div className="p-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full mt-2" /></div>;
    }

    if (user) {
      return (
        <div className="flex flex-col gap-2 p-4">
          <Button variant="ghost" className="justify-start h-auto" onClick={() => handleMobileNav(`/profile/${user.id}`)}>
            <ProfileAvatar className="h-8 w-8 mr-3" />
            <div className="flex flex-col items-start">
                <span className="font-semibold">My Profile</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </Button>
          <Separator />
          {headerIcons.map((item) => (
             <Button variant="ghost" className="justify-start" key={item.label} onClick={() => handleMobileNav(item.href || '#')}>
                <item.icon className="mr-2 h-4 w-4" /> {item.label}
                {item.showBadge && item.badge > 0 && <Badge variant="destructive" className="ml-auto">{item.badge}</Badge>}
             </Button>
          ))}
          <Separator />
          <Button variant="ghost" className="justify-start" onClick={() => handleMobileNav('/settings')}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
          <Button variant="ghost" className="justify-start text-destructive hover:text-destructive" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 p-4">
        <Button onClick={() => handleMobileNav('/login')} variant="outline">Sign In</Button>
        <Button onClick={() => handleMobileNav('/register')}>Join Now</Button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between">
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
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <Button variant="ghost" size="sm" onClick={handleLovingItClick} className="relative p-3 text-destructive hover:text-destructive/80" title="Loving it">
              <Heart className="h-5 w-5" />
              {lovingItCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">{lovingItCount > 99 ? '99+' : lovingItCount}</Badge>}
            </Button>
            <Link to="/partnerships"><Button variant="ghost" size="sm" className="p-3 text-accent"><Handshake className="h-5 w-5" /></Button></Link>

            {renderAuthContent()}
          </div>

          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background pb-4">
            {renderMobileMenuContent()}
          </div>
        )}
      </div>
    </header>
  );
};
