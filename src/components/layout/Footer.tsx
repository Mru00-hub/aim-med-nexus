import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Flag,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * AIMedNet Footer Component
 * Professional footer with contact information, links, and social media
 * Includes copyright and creator attribution as requested
 */
export const Footer = () => {
  const footerLinks = {
    platform: [
      { label: 'Forums & Communities', href: '/forums' },
      { label: 'Jobs & Networking', href: '/networking' },
      { label: 'Partnerships', href: '/partnerships' },
      { label: 'Premium Features', href: '/premium' }
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Support', href: '/support' },
      { label: 'Feedback', href: '/feedback' },
      { label: 'Report Content', href: '/report' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Code of Conduct', href: '/code-of-conduct' }
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Instagram, href: '#', label: 'Instagram' }
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer Content */}
      <div className="container-medical py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-foreground rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                  <div className="w-3 h-3 bg-primary-foreground rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold">AIMedNet</div>
                <div className="text-sm opacity-80">Healthcare Professionals</div>
              </div>
            </div>
            
            <p className="text-sm opacity-90 leading-relaxed">
              Where Healthcare Professionals Connect, Collaborate, and Grow. 
              Your complete professional ecosystem for medical networking and career advancement.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:contact@aimednet.com" className="hover:underline">
                  contact@aimednet.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+917094800291" className="hover:underline">
                  +91 7094800291
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>India</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Media & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
                title={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/report">
                <Flag className="h-4 w-4 mr-2" />
                Report Content
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/feedback">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-primary-foreground/20 py-6">
        <div className="container-medical">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm opacity-80">
            <div>
              © 2025 AIMedNet. All rights reserved. Created by Dr. Mrudula Bhalke
            </div>
            <div className="mt-2 md:mt-0">
              <span>Contact: </span>
              <a 
                href="mailto:mrudulabhalke75917@gmail.com" 
                className="hover:underline"
              >
                mrudulabhalke75917@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};