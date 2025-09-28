import React, { useState } from 'react';
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
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * AIMedNet Header Component
 * Features: Logo, loving it counter, navigation icons with notifications
 * Real-time counters and notification badges for professional healthcare networking
 */
export const Header = () => {
  const { user, signOut } = useAuth();
  // State for loving it counter - starts at 0 as requested
  const [lovingItCount, setLovingItCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mock notification counts - in real app these would come from API/state
  const notificationCount = 5; // Unread notifications
  const socialRequestCount = 3; // Connection requests  
  const inboxCount = 7; // Unread messages

  const handleLovingItClick = () => {
    setLovingItCount(prev => prev + 1);
  };

  const headerIcons = [
    {
      icon: Heart,
      label: `Loving it`,
      onClick: handleLovingItClick,
      showBadge: true,
      badge: lovingItCount,
      color: 'text-destructive hover:text-destructive/80'
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/notifications',
      showBadge: true,
      badge: notificationCount,
      color: 'text-warning hover:text-warning/80'
    },
    {
      icon: Users,
      label: 'Partnerships',
      href: '/partnerships',
      showBadge: false,
      color: 'text-accent hover:text-accent/80'
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
          {/* Logo with Healthcare Element */}
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

          {/* Desktop Navigation Icons */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {/* Show loving it counter for everyone */}
            <div className="relative">
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
            </div>
            
            {/* Show navigation links for partnerships */}
            <Link to="/partnerships">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-3 hover:bg-muted/50 transition-colors text-accent hover:text-accent/80"
                title="Partnerships"
              >
                <Users className="h-5 w-5" />
              </Button>
            </Link>

            {/* Show navigation for forums, jobs, networking */}
            <Link to="/forums">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-3 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
                title="Forums"
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </Link>
            
            <Link to="/jobs">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-3 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
                title="Jobs"
              >
                <Briefcase className="h-5 w-5" />
              </Button>
            </Link>
            
            <Link to="/networking">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-3 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary"
                title="Networking"
              >
                <Users className="h-5 w-5" />
              </Button>
            </Link>

            {user ? (
              <>
                {headerIcons.slice(1).map((item, index) => (
                <div key={index} className="relative">
                  {item.onClick ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={item.onClick}
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
                  ) : (
                    <Link to={item.href || '#'}>
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
                  )}
                  </div>
                ))}
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="btn-medical">
                    Join Now
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {user && (
            <div className="hidden md:flex">
              {/* Sign Out Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={signOut}
                className="ml-4"
              >
                Sign Out
              </Button>
            </div>
          )}

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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="grid grid-cols-3 gap-4 p-4">
              {/* Loving it counter for mobile */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleLovingItClick();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex flex-col items-center gap-1 p-3 h-auto text-destructive hover:text-destructive/80"
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
                  <span className="text-xs text-center">Loving it</span>
                </Button>
              </div>
              
              {/* Partnerships for mobile */}
              <Link to="/partnerships" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex flex-col items-center gap-1 p-3 h-auto text-accent hover:text-accent/80"
                >
                  <Users className="h-5 w-5" />
                  <span className="text-xs text-center">Partnerships</span>
                </Button>
              </Link>

              {user && headerIcons.slice(1).map((item, index) => (
                <div key={index} className="relative">
                  {item.onClick ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        item.onClick();
                        setMobileMenuOpen(false);
                      }}
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
                      <span className="text-xs text-center">{item.label}</span>
                    </Button>
                  ) : (
                    <Link to={item.href || '#'} onClick={() => setMobileMenuOpen(false)}>
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
                        <span className="text-xs text-center">{item.label}</span>
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};