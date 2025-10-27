import React from 'react';
import { Certification } from '@/integrations/supabase/community.api';
import { ShieldCheck, LinkIcon } from 'lucide-react';

type CertificationCardProps = {
  cert: Certification;
};

export const CertificationCard: React.FC<CertificationCardProps> = ({ cert }) => {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <ShieldCheck className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <a 
          href={cert.credential_url || undefined} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="font-semibold hover:underline data-[disabled=true]:no-underline data-[disabled=true]:cursor-default" 
          data-disabled={!cert.credential_url}
        >
          {cert.certification_name}
          {cert.credential_url && <LinkIcon className="h-3 w-3 inline-block ml-1" />}
        </a>
        <p className="text-sm text-muted-foreground">{cert.issuing_org}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {cert.issue_date && `Issued: ${new Date(cert.issue_date).toLocaleDateString()}`}
          {cert.expiry_date && ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
        </p>
      </div>
    </div>
  );
};
