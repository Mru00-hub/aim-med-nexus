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
import { updateMembershipStatus } from '@/integrations/supabase/community.api';
import { MemberList } from '@/components/forums/MemberList'; // Assuming this is your component
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function MembersPage() {
    const { spaceId } = useParams<{ spaceId: string }>();
    const { user } = useAuth();
    const { spaces } = useCommunity();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Find the current space from the global context
    const space = useMemo(() => spaces.find(s => s.id === spaceId), [spaces, spaceId]);

    // Fetch the list of active members
    const { memberList, isLoadingList, refreshMemberList } = useSpaceMemberList(spaceId);

    // Determine if the current user has admin/mod privileges FOR THIS SPACE
    const isUserAdminOrMod = useMemo(() => {
        if (!user || !memberList) return false;
        const currentUserMembership = memberList.find(member => member.id === user.id);
        return currentUserMembership?.role === 'ADMIN' || currentUserMembership?.role === 'MODERATOR';
    }, [user, memberList]);

    // Fetch pending requests ONLY if the user is an admin/mod
    const { pendingRequests, isLoadingRequests, refreshPendingRequests } = usePendingRequests(spaceId, isUserAdminOrMod);

    // Handlers for approving/rejecting members
    const handleMembershipUpdate = useCallback(async (membershipId: string, newStatus: 'ACTIVE' | 'BANNED') => {
        try {
            await updateMembershipStatus(membershipId, newStatus);
            toast({ title: 'Success', description: `Membership has been updated.` });
            // Refresh both lists
            refreshPendingRequests();
            refreshMemberList();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    }, [refreshPendingRequests, refreshMemberList, toast]);

    if (!space) {
        return ( // Simple loading/not-found state
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

                {/* --- CONDITIONAL ADMIN UI --- */}
                {isUserAdminOrMod && (
                    <Card className="mb-8">
                        <CardHeader><CardTitle>Pending Requests ({pendingRequests.length})</CardTitle></CardHeader>
                        <CardContent>
                            <MemberList 
                                members={pendingRequests} 
                                isLoading={isLoadingRequests}
                                emptyStateMessage="No pending requests."
                                isAdminView={true} 
                                onApprove={(membershipId) => handleMembershipUpdate(membershipId, 'ACTIVE')}
                                onReject={(membershipId) => handleMembershipUpdate(membershipId, 'BANNED')}
                            />
                        </CardContent>
                    </Card>
                )}
                
                {/* --- PUBLIC MEMBER LIST --- */}
                <Card>
                    <CardHeader><CardTitle>Active Members ({memberList.length})</CardTitle></CardHeader>
                    <CardContent>
                        <MemberList 
                            members={memberList.map(m => ({ user_id: m.id, membership_id: m.id, full_name: m.full_name, profile_picture_url: m.profile_picture_url, role: m.role }))} 
                            isLoading={isLoadingList}
                            isAdminView={isUserAdminOrMod}
                            // Only allow banning in non-public spaces
                            onBan={space.space_type !== 'PUBLIC' ? (membershipId) => handleMembershipUpdate(membershipId, 'BANNED') : undefined}
                        />
                    </CardContent>
                </Card>

            </main>
            <Footer />
        </div>
    );
}

// NOTE: You will need to update your MemberList and MemberCard components to accept and use the
// isAdminView, onApprove, and onReject props to show the management buttons.
