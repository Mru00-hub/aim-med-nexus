import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react'; // A nice icon for documents

type InfoPageLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ title, children }) => {
  return (
    // 1. Full page structure with a background color
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <Header />
      
      {/* 2. Main content area with consistent padding and animation */}
      <main className="container-medical flex-grow py-12 md:py-16">
        <div className="max-w-4xl mx-auto animate-fade-in">
        
          {/* 3. Wrap content in a Card for a much cleaner look */}
          <Card className="card-medical">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* 4. Use the 'prose' class for beautiful typography on long text */}
              <div className="prose dark:prose-invert max-w-none text-base">
                {children}
              </div>
            </CardContent>
          </Card>
          
        </div>
      </main>
      
      <Footer />
    </div>
  );
};


