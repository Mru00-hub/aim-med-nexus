import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

type StatCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  isString?: boolean;
};

export const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, isString = false }) => (
  <Card className="bg-muted/30">
    <CardContent className="p-3 sm:p-4">
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-2" />
      <p className="text-xl sm:text-2xl font-bold">
        {isString ? value : (value as number).toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
    </CardContent>
  </Card>
);
