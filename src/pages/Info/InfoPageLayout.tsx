import React from 'react';

type InfoPageLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export const InfoPageLayout: React.FC<InfoPageLayoutProps> = ({ title, children }) => {
  return (
    <div className="container-medical py-12 md:py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{title}</h1>
        <div className="prose dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
};
