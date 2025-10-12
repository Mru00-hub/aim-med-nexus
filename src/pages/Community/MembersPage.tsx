// src/pages/Community/MembersPage.tsx

import React, { useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity } from '@/context/CommunityContext';
import { useSpaceMemberList, usePendingRequests } from '@/hooks/useSpaceData';
import { updateMembershipStatus, updateMemberRole } from '@/integrations/supabase/community.api';
import { MemberList } from '@/components/forums/MemberList';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Enums } from '@/integrations/supabase/types';
import { DisplayMember } from '@/components/forums/MemberCard';


export default function MembersPage() {
    const { spaceId } = useParams<{ spaceId: string }>();
    const { user } = useAuth();
    const { spaces } = useCommunity();
    const navigate = useNavigate();
    const { toast } = useToast();

    const space = useMemo(() => spaces.find(s => s.id === spaceId), [spaces, spaceId]);
    const { memberList, isLoadingList, refreshMemberList } = useSpaceMemberList(spaceId);

    const isUserAdminOrMod = useMemo(() => {
        if (!user || !memberList) return false;
        const currentUserMembership = memberList.find(member => member.id === user.id);
        return currentUserMembership?.role === 'ADMIN' || currentUserMembership?.role === 'MODERATOR';
    }, [user, memberList]);

    const { pendingRequests, isLoadingRequests, refreshPendingRequests } = usePendingRequests(spaceId, isUserAdminOrMod);

    const mapPendingRequestToMember = (requests: PendingRequest[]): DisplayMember[] => {
        return requests.map(r => ({
            user_id: r.user_id, // The DisplayMember type needs user_id
            membership_id: r.membership_id,
            full_name: r.full_name,
            profile_picture_url: r.profile_picture_url,
            role: 'MEMBER', // Pending requests are always for the 'MEMBER' role
        }));
    };

    const handleMembershipUpdate = useCallback(async (membershipId: string, newStatus: Enums<'membership_status'>) => {
        try {
            await updateMembershipStatus(membershipId, newStatus);
            toast({ title: 'Success', description: `Membership has been updated.` });
            refreshPendingRequests();
            refreshMemberList();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    }, [refreshPendingRequests, refreshMemberList, toast]);

    const handleRoleChange = useCallback(async (membershipId: string, newRole: Enums<'membership_role'>) => {
        try {
            await updateMemberRole(membershipId, newRole);
            toast({ title: 'Success', description: `Member role has been updated.` });
            refreshMemberList(); // Refresh the list to show the new role
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    }, [refreshMemberList, toast]);

    if (!space) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="container mx-auto py-8 px-4 flex-grow"><p>Loading space or space not found...</p></main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="container mx-auto py-8 px-4 flex-grow">
                <Button variant="outline" size="sm" onClick={() => navigate(`/community/space/${spaceId}`)} className="mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Space
                </Button>
                <h1 className="text-3xl font-bold mb-2">Members of {space.name}</h1>
                <p className="text-muted-foreground mb-8">A list of all active members in this space.</p>

                {isUserAdminOrMod && (
                    <Card className="mb-8">
                        <CardHeader><CardTitle>Pending Requests ({isLoadingRequests ? '...' : pendingRequests.length})</CardTitle></CardHeader>
                        <CardContent>
                            <MemberList 
                                members={pendingRequests.map(r => ({ ...r, role: 'MEMBER' }))} // FIX #1 HERE
                                isLoading={isLoadingRequests}
                                emptyStateMessage="No pending requests."
                                isCurrentUserAdmin={isUserAdminOrMod} 
                                onApprove={(membershipId) => handleMembershipUpdate(membershipId, 'ACTIVE')}
                                onReject={(membershipId) => handleMembershipUpdate(membershipId, 'BANNED')} // Note: Rejecting sets status to BANNED
                            />
                        </CardContent>
                    </Card>
                )}
                
                <Card>
                    <CardHeader><CardTitle>Active Members ({isLoadingList ? '...' : memberList.length})</CardTitle></CardHeader>
                    <CardContent>
                        <MemberList 
                            members={memberList.map(m => ({ user_id: m.id, membership_id: m.membership_id, full_name: m.full_name, profile_picture_url: m.profile_picture_url, role: m.role }))} // FIX #2 HERE
                            isLoading={isLoadingList}
                            isCurrentUserAdmin={isUserAdminOrMod}
                            onRoleChange={handleRoleChange}
                            onBan={space.space_type !== 'PUBLIC' ? (membershipId) => handleMembershipUpdate(membershipId, 'BANNED') : undefined}
                        />
                    </CardContent>
                </Card>

            </main>
            <Footer />
        </div>
    );
}
