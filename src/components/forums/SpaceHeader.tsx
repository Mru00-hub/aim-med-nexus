import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SpaceWithDetails, MemberProfile, Enums } from '@/integrations/supabase/community.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Users, Hash, Trash2, Pencil, Loader2, Crown } from 'lucide-react';

interface SpaceHeaderProps {
  space: SpaceWithDetails;
  memberList: MemberProfile[];
  memberCount: number;
  threadCount: number;
  isLoadingMetrics: boolean;
  isLoadingList: boolean;
  currentUserRole: Enums<'membership_role'> | null;
  isUserCreator: boolean;
  onSave: (payload: { name: string; description?: string | null; join_level: Enums<'space_join_level'> }) => Promise<void>;
  onLeave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onTransfer: (newOwnerId: string) => Promise<void>;
}

export const SpaceHeader: React.FC<SpaceHeaderProps> = ({
  space,
  memberList,
  memberCount,
  threadCount,
  isLoadingMetrics,
  isLoadingList,
  currentUserRole,
  isUserCreator,
  onSave,
  onLeave,
  onDelete,
  onTransfer
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState(space.name);
  const [editedDescription, setEditedDescription] = useState(space.description || '');
  const [editedJoinLevel, setEditedJoinLevel] = useState<Enums<'space_join_level'>>(space.join_level);
  
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (space) {
      setEditedName(space.name);
      setEditedDescription(space.description || '');
      setEditedJoinLevel(space.join_level);
    }
  }, [space]);

  const potentialNewOwners = useMemo(() => {
    return memberList.filter(member => member.id !== space.creator_id);
  }, [memberList, space.creator_id]);

  const isUserAdminOrMod = currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR';

  const getRoleBadgeVariant = (role: 'ADMIN' | 'MODERATOR' | 'MEMBER') => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'MODERATOR': return 'default';
      default: return 'secondary';
    }
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    await onSave({
      name: editedName,
      description: editedDescription,
      join_level: editedJoinLevel,
    });
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleTransferClick = async () => {
    setIsTransferring(true);
    await onTransfer(selectedNewOwnerId);
    setIsTransferring(false);
    setShowTransferDialog(false);
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          {isEditing ? (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Editing Space Details</h3>
              <div>
                <Label htmlFor="edit-name">Space Name</Label>
                <Input id="edit-name" value={editedName} onChange={(e) => setEditedName(e.target.value)} className="text-2xl h-auto p-2 mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea id="edit-desc" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="edit-join">Join Level</Label>
                <Select value={editedJoinLevel} onValueChange={(v: Enums<'space_join_level'>) => setEditedJoinLevel(v)}>
                  <SelectTrigger className="w-[180px] mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleSaveClick} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-3xl break-words">{space.name}</CardTitle>
                <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap mt-2">
                  <span>{space.description}</span>
                  <Badge variant={space.join_level === 'INVITE_ONLY' ? 'secondary' : 'default'}>
                    {space.join_level.replace('_', ' ')}
                  </Badge>
                </div> 
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 sm:ml-4">
                {isUserCreator ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setShowTransferDialog(true)}><Crown className="h-4 w-4 mr-2" /> Transfer</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogDescription>This will permanently delete the <strong>{space.name}</strong> space and all content. This action cannot be undone.</AlertDialogDescription>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : isUserAdminOrMod ? (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                ) : currentUserRole === 'ACTIVE' ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="outline">Leave Space</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle></AlertDialogHeader>
                      <AlertDialogDescription>You will lose access to this space and its private threads. You may need to request to join again later.</AlertDialogDescription>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onLeave}>Leave Space</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground border-t">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <Link to={`/community/space/${space.id}/members`} className="hover:underline">
                {isLoadingMetrics ? <Skeleton className="h-4 w-24 inline-block" /> : <span>{memberCount} Members</span>}
              </Link>
            </div>
            <div className="flex items-center gap-1.5">
              <Hash className="h-4 w-4 text-primary" />
              {isLoadingMetrics ? <Skeleton className="h-4 w-24 inline-block" /> : <span>{threadCount} Threads</span>}
            </div>
          </div>
          {memberList && memberList.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-base mb-3">Key Members</h4>
              {isLoadingList ? (
                <Skeleton className="h-6 w-full" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {memberList
                    .filter(member => member.role === 'ADMIN' || member.role === 'MODERATOR')
                    .slice(0, 5) 
                    .map(member => (
                      <Link to={`/profile/${member.id}`} key={member.id}>
                        <Badge variant={getRoleBadgeVariant(member.role)} className="hover:opacity-80 transition-opacity">
                          {member.full_name}
                          <span className="ml-1.5 opacity-75">({member.role.charAt(0)})</span>
                        </Badge>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership of "{space.name}"</DialogTitle>
            <DialogDescription>Select a member to become the new owner. You will become an admin. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="new-owner-select">Select New Owner</Label>
            <Select value={selectedNewOwnerId} onValueChange={setSelectedNewOwnerId}>
              <SelectTrigger id="new-owner-select"><SelectValue placeholder="Select a member..." /></SelectTrigger>
              <SelectContent>
                {potentialNewOwners.map(member => (
                  <SelectItem key={member.id} value={member.id}>{member.full_name} ({member.role})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowTransferDialog(false)} disabled={isTransferring}>Cancel</Button>
            <Button onClick={handleTransferClick} disabled={!selectedNewOwnerId || isTransferring}>
              {isTransferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Transfer Ownership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
