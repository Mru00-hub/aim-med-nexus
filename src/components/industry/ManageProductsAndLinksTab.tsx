import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addCompanyLink,
  updateCompanyLink,
  deleteCompanyLink,
  AddLinkPayload,
  UpdateLinkPayload,
  CompanyLink,
  getCompanyProfileDetails, // We'll get links from the main profile query
} from '@/integrations/supabase/industry.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Edit, Trash2, Loader2, Link as LinkIcon } from 'lucide-react';
import { Enums } from '@/types';

interface ManageProductsAndLinksTabProps {
  companyId: string;
}

// Zod schema for the form
const linkFormSchema = z.object({
  link_type: z.enum(['product', 'social', 'linkedin', 'url']),
  title: z.string().min(3, 'Title is required'),
  url: z.string().url('Must be a valid URL'),
  description: z.string().optional(),
});
type LinkFormData = z.infer<typeof linkFormSchema>;

export const ManageProductsAndLinksTab: React.FC<ManageProductsAndLinksTabProps> = ({ companyId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<CompanyLink | null>(null);

  // Get links data from the cached company profile query
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['companyProfile', companyId],
    queryFn: () => getCompanyProfileDetails(companyId),
  });
  const links = profileData?.links || [];

  const form = useForm<LinkFormData>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      link_type: 'product',
      title: '',
      url: '',
      description: '',
    },
  });

  const invalidateAndClose = () => {
    queryClient.invalidateQueries({ queryKey: ['companyProfile', companyId] });
    setIsDialogOpen(false);
    setEditingLink(null);
    form.reset();
  };

  // --- Mutations ---
  const addLinkMutation = useMutation({
    mutationFn: addCompanyLink,
    onSuccess: () => {
      toast({ title: 'Success', description: 'New link added.' });
      invalidateAndClose();
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateLinkMutation = useMutation({
    mutationFn: updateCompanyLink,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Link updated.' });
      invalidateAndClose();
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (payload: { p_link_id: string }) => deleteCompanyLink(payload),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Link deleted.' });
      queryClient.invalidateQueries({ queryKey: ['companyProfile', companyId] });
    },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  // --- Handlers ---
  const handleOpenDialog = (link: CompanyLink | null = null) => {
    if (link) {
      setEditingLink(link);
      form.reset({
        title: link.title,
        url: link.url,
        link_type: link.link_type,
        description: link.description || '',
      });
    } else {
      setEditingLink(null);
      form.reset({
        link_type: 'product',
        title: '',
        url: '',
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = (data: LinkFormData) => {
    if (editingLink) {
      // This is an Update
      const payload: UpdateLinkPayload = {
        p_link_id: editingLink.id,
        p_title: data.title,
        p_url: data.url,
        p_link_type: data.link_type as Enums<'link_type_enum'>,
        p_description: data.description,
      };
      updateLinkMutation.mutate(payload);
    } else {
      // This is a Create
      const payload: AddLinkPayload = {
        p_company_id: companyId,
        p_title: data.title,
        p_url: data.url,
        p_link_type: data.link_type as Enums<'link_type_enum'>,
        p_description: data.description,
      };
      addLinkMutation.mutate(payload);
    }
  };

  const isMutating = addLinkMutation.isPending || updateLinkMutation.isPending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Products & Links</CardTitle>
          <CardDescription>Add or edit links to your products, social media, and more.</CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog(null)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingProfile && <Loader2 className="h-6 w-6 animate-spin" />}
        
        {links.length === 0 && !isLoadingProfile && (
          <p className="text-sm text-muted-foreground text-center p-4">No products or links added yet.</p>
        )}

        {links.map((link) => (
          <Card key={link.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4">
            <div className="flex-1 min-w-0">
              <span className="text-xs uppercase font-semibold text-primary">{link.link_type}</span>
              <h4 className="font-semibold truncate">{link.title}</h4>
              <p className="text-sm text-muted-foreground truncate">{link.url}</p>
              {link.description && <p className="text-sm text-muted-foreground mt-1">{link.description}</p>}
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => handleOpenDialog(link)}>
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive_outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{link.title}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Are you sure you want to permanently delete this link?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => deleteLinkMutation.mutate({ p_link_id: link.id })}
                      disabled={deleteLinkMutation.isPending}
                    >
                      {deleteLinkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))}
      </CardContent>

      {/* --- Add/Edit Dialog --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? 'Edit' : 'Add'} Product or Link</DialogTitle>
            <DialogDescription>Fill in the details for your link. The "Type" helps categorize it on your profile.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="link_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="url">Website/Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., Our New Product" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl><Textarea {...field} placeholder="A short description..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isMutating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingLink ? 'Save Changes' : 'Add Link'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

