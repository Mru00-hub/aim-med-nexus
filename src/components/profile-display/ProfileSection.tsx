import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from 'lucide-react';

type ProfileSectionProps = {
  title: string;
  icon: React.ElementType;
  items?: any[]; // Used to check if array is empty
  hasData?: boolean; // Used for single objects
  isCollapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  icon: Icon,
  items,
  hasData = false,
  isCollapsible = false,
  defaultOpen = true,
  children
}) => {
  // 🚀 PLAN: Conditional rendering logic
  const dataExists = hasData || (items && items.length > 0);
  if (!dataExists) {
    return null;
  }

  const header = (
    <h2 className="text-xl font-semibold flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      {title}
    </h2>
  );

  if (isCollapsible) {
    return (
      <Collapsible defaultOpen={defaultOpen} className="w-full">
        <Separator className="my-6" />
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full flex justify-between items-center p-2 h-auto hover:bg-muted">
            {header}
            <ChevronDown className="h-5 w-5 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <section>
      <Separator className="my-6" />
      <div className="mb-4">{header}</div>
      {children}
    </section>
  );
};
