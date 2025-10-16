import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, GraduationCap, Briefcase, User } from 'lucide-react';

type RegistrationTypeStepProps = {
  registrationType: string;
  setRegistrationType: (type: string) => void;
  onNext: () => void;
};

const registrationOptions = [
  {
    type: 'student',
    title: 'Student Registration',
    description: 'For medical, nursing, and allied health students',
    icon: GraduationCap,
    features: ['Basic profile', 'Educational forums', 'Student networking', 'Career guidance'],
  },
  {
    type: 'professional', 
    title: 'Professional Registration',
    description: 'For all healthcare industry professionals (free)',
    icon: Briefcase,
    features: ['Unlimited forums access', 'Full networking capabilities', 'Job alerts & opportunities', 'Career upskilling resources'],
  }
];

export const RegistrationTypeStep: React.FC<RegistrationTypeStepProps> = ({ registrationType, setRegistrationType, onNext }) => {
  const handleCardClick = (type: string) => {
    setRegistrationType(type);
    onNext();
  };
  
  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {registrationOptions.map((option) => (
          <Card 
            key={option.type}
            className={`card-medical cursor-pointer transition-all hover:shadow-hover ${
              registrationType === option.type ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
            onClick={() => handleCardClick(option.type)}
          >
            <CardHeader className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <option.icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg sm:text-xl">{option.title}</CardTitle>
              <CardDescription className="text-sm sm:text-base">{option.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ul className="space-y-2">
                {option.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-xs sm:text-sm">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
        <Card className="card-medical bg-muted/50 border-dashed cursor-not-allowed">
          <CardHeader className="text-center p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg sm:text-xl text-muted-foreground">Premium Registration</CardTitle>
              <CardDescription className="text-sm sm:text-base">For practicing medical & allied healthcare professionals</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 text-center">
              <Badge variant="outline">Coming Soon</Badge>
              <p className="text-muted-foreground text-sm mt-4">
                  We're preparing exclusive features for premium members. Stay tuned!
              </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
