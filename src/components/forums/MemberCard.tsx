// src/components/forums/MemberCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, ShieldX } from 'lucide-react';

// A unified type to handle members from different sources
export type DisplayMember = {
    user_id: string; // This is the profile ID
    membership_id?: string; // This is the ID of the membership row itself
    full_name: string;
    profile_picture_url: string | null;
    role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
};

interface MemberCardProps {
  member: DisplayMember;
  isAdminView?: boolean;
  onApprove?: (membershipId: string) => void;
  onReject?: (membershipId: string) => void;
  onBan?: (membershipId: string) => void;
}

// Your helper functions are great, let's keep them!
const getInitials = (name: string) => {
  const names = name.split(' ');
  return names.length > 1
    ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const getBadgeVariant = (role: DisplayMember['role']) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'MODERATOR': return 'default';
      default: return 'secondary';
    }
};

export const MemberCard: React.FC<MemberCardProps> = ({ member, isAdminView, onApprove, onReject, onBan }) => {
    const handleAction = (e: React.MouseEvent, action?: (id: string) => void) => {
        e.stopPropagation(); // Prevents navigating to profile when clicking a button
        e.preventDefault();
        // The membership_id is needed to approve/reject/ban
        if (action && member.membership_id) {
            action(member.membership_id);
        }
    };
    
    // The main card is now a link to the user's profile page
    return (
        <Link to={`/profile/${member.user_id}`} className="block group">
            <Card className="transition-all group-hover:shadow-md group-hover:border-primary/50">
                <CardContent className="p-4 flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={member.profile_picture_url || ''} alt={member.full_name} />
                            <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-semibold text-lg">{member.full_name}</p>
                        </div>
                        <Badge variant={getBadgeVariant(member.role)} className="capitalize">
                            {member.role.toLowerCase()}
                        </Badge>
                    </div>

                    {/* Conditional Admin Buttons */}
                    {isAdminView && (
                        <div className="flex items-center gap-2">
                            {onApprove && (
                                <Button size="icon" variant="outline" onClick={(e) => handleAction(e, onApprove)} title="Approve">
                                    <Check className="h-4 w-4 text-green-500" />
                                </Button>
                            )}
                            {onReject && (
                                <Button size="icon" variant="outline" onClick={(e) => handleAction(e, onReject)} title="Reject">
                                    <X className="h-4 w-4 text-red-500" />
                                </Button>
                            )}
                            {onBan && (
                                <Button size="icon" variant="destructive" onClick={(e) => handleAction(e, onBan)} title="Ban User">
                                    <ShieldX className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
};
