import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { deleteCurrentUser } from '@/integrations/supabase/user.api';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

/**
 * A dedicated component for the "Account" settings tab.
 * This contains the "Delete Account" danger zone.
 */
const AccountSettingsTab = () => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteCurrentUser();
      await signOut(); // Sign out the user
      navigate('/'); // Redirect to homepage
      toast.success('Account deleted successfully.');
    } catch (error) {
      toast.error('Failed to delete account. Please try again.');
      console.error(error);
    } finally {
      setIsDeleting(false);
      setIsAlertOpen(false);
    }
  };

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
        <CardDescription>
          This action is permanent and cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Once you delete your account, all of your data, including your profile,
          messages, and connections, will be permanently removed from our servers.
        </p>
      </CardContent>
      <CardFooter className="flex justify-end bg-muted/50 p-4">
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Your Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account, profile, messages, and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

/**
 * A placeholder component for future notification settings.
 */
const NotificationSettingsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how you receive notifications from AIMedNet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Email and in-app notification settings will be available here soon.
        </p>
        {/* You will add your notification toggles/switches here */}
      </CardContent>
    </Card>
  );
};

/**
 * The main Settings Page, which uses tabs to organize different setting areas.
 */
export const SettingsPage = () => {
  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        Settings
      </h1>
      
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="mt-6">
          <AccountSettingsTab />
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <NotificationSettingsTab />
        </TabsContent>
      </Tabs>
    </main>
  );
};

// Make sure to export it for your router
export default SettingsPage;
