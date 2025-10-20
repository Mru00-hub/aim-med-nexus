// src/components/layout/Header.tsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Bell, MessageSquare, Users, MessageCircle, Menu, X, Handshake, LogIn, UserPlus,UserIcon, LogOut, Settings, Shield, CreditCard, Trash2, Loader2 } from 'lucide-react';
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
import { useSocialCounts } from '@/context/SocialCountsContext'; 
import { getPendingRequests } from '@/integrations/supabase/social.api';
import { deleteCurrentUser } from '@/integrations/supabase/user.api'; // 1. Import delete function
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export const Header = () => {
  const { user, loading, signOut, initialUnreadCount, profile} = useAuth();
  const navigate = useNavigate();
  const [lovingItCount, setLovingItCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { 
    requestCount, 
    unreadInboxCount, 
    unreadNotifCount,
    setUnreadInboxCount // Get the new count
  } = useSocialCounts();

  // --- THIS ARRAY DEFINITION WAS ACCIDENTALLY OMITTED ---
  const headerIcons = [
    { icon: Bell, label: 'Notifications', href: '/notifications', showBadge: true, badge: unreadNotifCount, color: 'text-warning hover:text-warning/80' },
    { icon: Users, label: 'Social', href: '/social', showBadge: true, badge: requestCount, color: 'text-primary hover:text-primary/80' },
    { icon: MessageCircle, label: 'Inbox', href: '/inbox', showBadge: true, badge: unreadInboxCount, color: 'text-premium hover:text-premium/80' }
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

  useEffect(() => {
    if (initialUnreadCount !== null) {
      setUnreadInboxCount(initialUnreadCount);
    } else if (!user) {
      // Explicitly set to 0 if there's no user
      setUnreadInboxCount(0);
    }
  }, [initialUnreadCount, user, setUnreadInboxCount]);

  const handleLovingItClick = async () => {
    setLovingItCount(prevCount => prevCount + 1);
    await incrementLoveCount();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteCurrentUser();
      await signOut(); // Sign out the user
      navigate('/'); // Redirect to homepage
      toast.success('Account deleted successfully.');
    } catch (error) {
      toast.error('Failed to delete account. Please try again.');
      console.error(error);
    } finally {
      setIsDeleting(false);
      setIsAlertOpen(false);
    }
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
                  <ProfileAvatar className="h-10 w-10" />
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
                {profile?.role === 'ADMIN' && (
                  <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
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
          {profile?.role === 'ADMIN' && (
            <Button variant="ghost" className="justify-start" onClick={() => handleMobileNav('/admin/dashboard')}>
              <Shield className="mr-2 h-4 w-4" /> Admin Dashboard
            </Button>
          )}
          <Button variant="ghost" className="justify-start" onClick={signOut}>
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
    // 3. WRAP in a Fragment
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-medical relative">
                  <div className="w-6 h-6 relative"><div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-1 bg-primary-foreground rounded-sm"></div></div><div className="absolute inset-0 flex items-center justify-center"><div className="w-1 h-4 bg-primary-foreground rounded-sm"></div></div><div className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-full"></div><div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-success rounded-full"></div></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-primary">AIMedNet</span>
                <span className="text-xs text-muted-foreground hidden sm:block">Healthcare Professionals</span>
              </div>
            </Link>

            {/* Right-Side Container */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" onClick={handleLovingItClick} className="relative p-2 sm:p-3 text-destructive hover:text-destructive/80" title="Loving it">
                <Heart className="h-5 w-5" />
                {lovingItCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-xs">{lovingItCount > 99 ? '99+' : lovingItCount}</Badge>}
              </Button>
              
              <Link to="/partnerships">
                  <Button variant="ghost" size="sm" className="p-2 sm:p-3 text-accent">
                      <Handshake className="h-5 w-5" />
                  </Button>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center">
                {renderAuthContent()}
              </div>
              
              {/* Mobile Nav Button */}
              <Button variant="ghost" size="sm" className="md:hidden p-2 sm:p-3" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-background">
              {renderMobileMenuContent()}
            </div>
          )}
        </div>
      </header>

      {/* Alert Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account, profile, messages, and all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
