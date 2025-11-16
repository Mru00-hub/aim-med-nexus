// src/components/industry/ManageManagersTab.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react'; // --- ADDED: useEffect, useMemo, useRef ---
import { Link } from 'react-router-dom'; // --- ADDED: Link ---
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCompanyManagers,
  addCompanyManager,
  updateCompanyManagerRole,
  removeCompanyManager,
  AddManagerPayload,
  UpdateManagerRolePayload,
  RemoveManagerPayload,
  CompanyManagerWithProfile,
} from '@/integrations/supabase/industry.api';
import { supabase } from '@/integrations/supabase/client'; // --- ADDED: supabase ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input'; // --- This will be replaced, but keep it for now ---
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2, Loader2, UserCog, User } from 'lucide-react';
import { ProfileAvatar } from '@/components/layout/ProfileAvatar';
import { useAuth } from '@/hooks/useAuth';
import { SearchableSelect } from '@/components/ui/searchable-select'; // --- ADDED: SearchableSelect ---

interface ManageManagersTabProps {
  companyId: string;
}

// --- ADDED: Profile type for searching ---
type ProfileOption = {
  id: string;
  label: string;
};

const managerFormSchema = z.object({
  user_id: z.string().uuid('Must be a valid User ID (UUID)'),
  role: z.enum(['ADMIN', 'MEMBER']),
});
type ManagerFormData = z.infer<typeof managerFormSchema>;

export const ManageManagersTab: React.FC<ManageManagersTabProps> = ({ companyId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- ADDED: State for profile search ---
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [profileSearch, setProfileSearch] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const isProfileMounted = useRef(false);

  const { data: managers, isLoading: isLoadingManagers } = useQuery({
    queryKey: ['companyManagers', companyId],
    queryFn: () => getCompanyManagers(companyId),
  });

  // --- ADDED: Debounced fetch for profiles ---
  useEffect(() => {
    const fetchSearchProfiles = async () => {
      setIsProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .or(`full_name.ilike.%${profileSearch}%`)
        .limit(10);
      
      if (data) setProfiles(data.map(p => ({ id: p.id, label: p.full_name || p.id })));
      if (error) console.error('Error fetching profiles:', error);
      setIsProfileLoading(false);
    };

    const fetchInitialProfiles = async () => {
      setIsProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .limit(10);
      
      if (data) setProfiles(data.map(p => ({ id: p.id, label: p.full_name || p.id })));
      if (error) console.error('Error fetching initial profiles:', error);
      setIsProfileLoading(false);
    };

    if (!isProfileMounted.current) {
      isProfileMounted.current = true;
      fetchInitialProfiles();
      return;
    }

    const searchTimer = setTimeout(() => {
      if (profileSearch.length < 2) {
        fetchInitialProfiles();
      } else {
        fetchSearchProfiles();
      }
    }, 500);
    
    return () => clearTimeout(searchTimer);

  }, [profileSearch]);

  const profileOptions = useMemo(() => 
    profiles.map(p => ({ value: p.id, label: p.label })),
    [profiles]
  );
  // --- END: Added profile search logic ---

  const form = useForm<ManagerFormData>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: {
      user_id: '',
      role: 'MEMBER',
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['companyManagers', companyId] });
  };

  // --- Mutations (no change) ---
  const addManagerMutation = useMutation({
    mutationFn: addCompanyManager,
    onSuccess: () => {
      toast({ title: 'Success', description: 'New manager added.' });
      invalidate();
      form.reset();
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateCompanyManagerRole,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Manager role updated.' });
      invalidate();
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const removeManagerMutation = useMutation({
    mutationFn: removeCompanyManager,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Manager removed.' });
      invalidate();
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  // --- Handlers (no change) ---
  const onAddManager = (data: ManagerFormData) => {
    const payload: AddManagerPayload = {
      p_company_id: companyId,
      p_user_id: data.user_id,
      p_role: data.role as 'ADMIN' | 'MEMBER',
    };
    addManagerMutation.mutate(payload);
  };

  const onUpdateRole = (manager: CompanyManagerWithProfile) => {
    const newRole = manager.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    const payload: UpdateManagerRolePayload = {
      p_manager_record_id: manager.id,
      p_new_role: newRole,
    };
    updateRoleMutation.mutate(payload);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Add New Manager</CardTitle>
          <CardDescription>Search for a user and assign them a role.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddManager)} className="space-y-4">
              
              {/* --- REPLACED: Input with SearchableSelect --- */}
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <SearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={profileOptions}
                      onSearchChange={setProfileSearch}
                      isLoading={isProfileLoading}
                      placeholder="Search for a user..."
                      searchPlaceholder="Search by name..."
                      emptyMessage="No user found."
                    />
                    <FormDescription>Select a user to add as a manager.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* --- END: Replacement --- */}

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member (Can post jobs/collabs)</SelectItem>
                        <SelectItem value="ADMIN">Admin (Can manage settings & other managers)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={addManagerMutation.isPending} className="w-full">
                {addManagerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Manager
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Current Managers</CardTitle>
          <CardDescription>The list of users who can manage this page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingManagers && <Loader2 className="h-6 w-6 animate-spin" />}

          {managers?.length === 0 && !isLoadingManagers && (
            <p className="text-sm text-muted-foreground text-center p-4">You are the only manager.</p>
          )}

          {managers?.map((manager) => {
            const isSelf = manager.user_id === user?.id;
            return (
              <Card key={manager.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
                
                {/* --- UPDATED: Avatar removed --- */}
                <Link 
                  to={`/profile/${manager.user_id}`} 
                  className="flex items-center gap-3 flex-1 min-w-0 group py-1"
                  title="View profile"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate group-hover:underline">{manager.profile?.full_name || '...'} {isSelf && '(You)'}</h4>
                    <p className="text-sm text-muted-foreground">{manager.role}</p>
                  </div>
                </Link>
                {/* --- END: Update --- */}

                <div className="flex gap-2 mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateRole(manager)}
                    disabled={isSelf || updateRoleMutation.isPending}
                    title={isSelf ? "You cannot change your own role" : `Change to ${manager.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'}`}
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    {manager.role === 'ADMIN' ? 'Make Member' : 'Make Admin'}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive_outline"
                        size="sm"
                        disabled={isSelf || removeManagerMutation.isPending}
                        title={isSelf ? "You cannot remove yourself" : "Remove manager"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {manager.profile?.full_name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove their management access. This action cannot be undone.
                          (You cannot remove the last admin).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={() => removeManagerMutation.mutate({ p_manager_record_id: manager.id })}
                          disabled={removeManagerMutation.isPending}
                        >
                          {removeManagerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Remove'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
