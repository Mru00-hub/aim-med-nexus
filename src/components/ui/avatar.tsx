import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cn } from "@/lib/utils"
// 1. Import your helper function and type
import { generateAvatarUrl } from "@/lib/utils"

export type AvatarProfile = {
  id: string;
  full_name: string;
  profile_picture_url: string | null;
};

// 2. Create a Context to hold the profile
const AvatarContext = React.createContext<AvatarProfile | null | undefined>(undefined);

// 3. Modify the Avatar root component
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    /** Pass the profile object here to auto-populate children */
    profile?: AvatarProfile | null;
  }
>(({ className, profile, ...props }, ref) => (
  // 4. Provide the profile to the context
  <AvatarContext.Provider value={profile}>
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  </AvatarContext.Provider>
))
Avatar.displayName = AvatarPrimitive.Root.displayName

// 5. Modify the AvatarImage component
const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, src, ...props }, ref) => {
  // 6. Consume the profile from context
  const profile = React.useContext(AvatarContext);

  // 7. Implement the fallback logic
  const finalSrc = useMemo(() => {
    // If a 'src' prop is passed directly, it wins.
    if (src) return src;
    // If no 'src' is passed, but 'profile' exists, use it.
    if (profile) {
      return profile.profile_picture_url || generateAvatarUrl(profile.full_name, profile.id);
    }
    // Otherwise, 'src' is undefined (which is fine)
    return undefined;
  }, [src, profile]);

  return (
    <AvatarPrimitive.Image
      ref={ref}
      src={finalSrc}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

// 8. Modify the AvatarFallback component
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  // 9. Consume the profile from context
  const profile = React.useContext(AvatarContext);

  // 10. Auto-generate initials if no children are provided
  const finalChildren = useMemo(() => {
    // If 'children' are passed directly (e.g., <AvatarFallback>JD</AvatarFallback>), they win.
    if (children) return children;
    // If no 'children', but 'profile' exists, generate initials.
    if (profile?.full_name) {
      const names = profile.full_name.split(' ');
      return names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : profile.full_name.substring(0, 2).toUpperCase();
    }
    // Otherwise, no children
    return null;
  }, [children, profile]);

  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    >
      {finalChildren}
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
