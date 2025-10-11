// src/components/forums/MemberCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, ShieldX, UserCog, UserCheck, UserX } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Enums } from '@/integrations/supabase/types';

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
  isCurrentUserAdmin: boolean; 
  onRoleChange?: (membershipId: string, newRole: Enums<'membership_role'>) => void;
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

export const MemberCard: React.FC<MemberCardProps> = ({ member, isCurrentUserAdmin, onRoleChange, onApprove, onReject }) => {
    // This handler now only handles Approve/Reject for pending requests.
    const handleAction = (e: React.MouseEvent, action?: (id: string) => void) => {
        e.stopPropagation();
        e.preventDefault();
        if (action && member.membership_id) {
            action(member.membership_id);
        }
    };
    
    return (
        <Card className="transition-all hover:shadow-md group">
            <CardContent className="p-4 flex items-center justify-between space-x-4">
                {/* The main user info is wrapped in a Link for navigation */}
                <Link to={`/profile/${member.user_id}`} className="flex items-center space-x-4 flex-grow">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={member.profile_picture_url || ''} alt={member.full_name} />
                        <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold text-lg group-hover:text-primary">{member.full_name}</p>
                    </div>
                    <Badge variant={getBadgeVariant(member.role)} className="capitalize">
                        {member.role.toLowerCase()}
                    </Badge>
                </Link>

                {/* --- UPDATED ADMIN CONTROLS SECTION --- */}
                <div className="flex items-center gap-2">
                    {/* A) Buttons for Pending Requests (Approve/Reject) */}
                    {isCurrentUserAdmin && onApprove && onReject && (
                        <>
                            <Button size="icon" variant="outline" onClick={(e) => handleAction(e, onApprove)} title="Approve">
                                <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="outline" onClick={(e) => handleAction(e, onReject)} title="Reject">
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        </>
                    )}

                    {/* B) Dropdown Menu for Active Members (Role Change/Ban) */}
                    {isCurrentUserAdmin && onRoleChange && member.membership_id && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent onClick={(e) => e.preventDefault()}>
                                <DropdownMenuItem onClick={() => onRoleChange(member.membership_id!, 'ADMIN')}>
                                    <UserCog className="mr-2 h-4 w-4" /> Make Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onRoleChange(member.membership_id!, 'MODERATOR')}>
                                    <UserCheck className="mr-2 h-4 w-4" /> Make Moderator
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onRoleChange(member.membership_id!, 'MEMBER')}>
                                    <UserX className="mr-2 h-4 w-4" /> Make Member
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => onBan && onBan(member.membership_id!)}>
                                    <ShieldX className="mr-2 h-4 w-4" /> Ban User
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
