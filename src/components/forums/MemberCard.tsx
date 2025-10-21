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
    current_position?: string | null;
    organization?: string | null;
    location_name?: string | null;
    specialization_name?: string | null;
};

interface MemberCardProps {
  member: DisplayMember;
  spaceType: Enums<'space_type'>;
  isCurrentUserAdmin: boolean; 
  onRoleChange?: (membershipId: string, newRole: Enums<'membership_role'>) => void;
  onApprove?: (membershipId: string) => void;
  onReject?: (membershipId: string) => void;
  onBan?: (membershipId: string) => void;
}

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

export const MemberCard: React.FC<MemberCardProps> = ({ member, isCurrentUserAdmin, onRoleChange, onApprove, onReject, onBan }) => {
    
    const handleAction = (e: React.MouseEvent, action?: (id: string) => void) => {
        e.stopPropagation();
        e.preventDefault();
        if (action && member.membership_id) {
            action(member.membership_id);
        }
    };

    const userDetails = [
        member.current_position,
        member.specialization_name,
        member.organization,
        member.location_name,
    ].filter(Boolean);
    
    // --- NEW: Determine which set of controls to show ---
    const showPendingControls = onApprove && onReject;
    const showActiveMemberControls = onRoleChange && member.membership_id;

    return (
        <Card className="transition-all hover:shadow-md group">
            <CardContent className="p-4 flex items-center justify-between space-x-4">
                <Link to={`/profile/${member.user_id}`} className="flex items-center space-x-4 flex-grow min-w-0">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={member.profile_picture_url || ''} alt={member.full_name} />
                        <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg group-hover:text-primary truncate">{member.full_name}</p>
                        
                        {userDetails.length > 0 && (
                          <p className="text-sm text-muted-foreground flex items-center flex-wrap truncate">
                            {userDetails.map((detail, index) => (
                              <React.Fragment key={index}>
                                <span>{detail}</span>
                                {index < userDetails.length - 1 && <span className="mx-1.5">&bull;</span>}
                              </React.Fragment>
                            ))}
                          </p>
                        )}
                    </div>
                    {/* Badge is only shown for active members, not pending */}
                    {!showPendingControls && (
                        <Badge variant={getBadgeVariant(member.role)} className="capitalize ml-auto sm:ml-0 flex-shrink-0">
                            {member.role.toLowerCase()}
                        </Badge>
                    )}
                </Link>

                {/* --- REFACTORED ADMIN CONTROLS --- */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Controls for Pending Requests */}
                    {isCurrentUserAdmin && showPendingControls && (
                        <>
                            <Button size="icon" variant="outline" onClick={(e) => handleAction(e, onApprove)} title="Approve">
                                <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="outline" onClick={(e) => handleAction(e, onReject)} title="Reject">
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        </>
                    )}

                    {/* Controls for Active Members */}
                    {isCurrentUserAdmin && showActiveMemberControls && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                {spaceType === 'COMMUNITY_SPACE' && member.role !== 'ADMIN' && (
                                    <DropdownMenuItem onClick={() => onRoleChange(member.membership_id!, 'ADMIN')}>
                                        <UserCog className="mr-2 h-4 w-4" /> Make Admin
                                    </DropdownMenuItem>
                                )}
                                {spaceType === 'FORUM' && member.role !== 'MODERATOR' && (
                                    <DropdownMenuItem onClick={() => onRoleChange(member.membership_id!, 'MODERATOR')}>
                                        <UserCheck className="mr-2 h-4 w-4" /> Make Moderator
                                    </DropdownMenuItem>
                                )}
                                {member.role !== 'MEMBER' && (
                                    <DropdownMenuItem onClick={() => onRoleChange(member.membership_id!, 'MEMBER')}>
                                        <UserX className="mr-2 h-4 w-4" /> Make Member
                                    </DropdownMenuItem>
                                )}
                                
                                {/* Conditionally render the Ban option */}
                                {onBan && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600" onClick={() => onBan(member.membership_id!)}>
                                            <ShieldX className="mr-2 h-4 w-4" /> Ban User
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
