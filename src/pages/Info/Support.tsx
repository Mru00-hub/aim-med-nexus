import { InfoPageLayout } from './InfoPageLayout';
import { Button } from '@/components/ui/button';
import { Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SupportPage() {
  return (
    <InfoPageLayout title="Contact Support">
      <p className="text-lg text-muted-foreground mb-8">
        Our team is here to help you with any questions, technical issues, or feedback you may have.
      </p>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3">Feedback</h3>
          <p className="mb-4">
            Have suggestions to improve AIMedNet? We'd love to hear them. 
            The best way to share your ideas is through our dedicated feedback form.
          </p>
          <Button asChild className="btn-medical">
            <Link to="/feedback">Submit Feedback</Link>
          </Button>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-xl font-semibold mb-3">Direct Contact</h3>
          <p className="mb-4">
            For urgent issues, account problems, or verification inquiries, 
            please reach out to us directly.
          </p>
          <div className="space-y-3">
            <a 
              href="mailto:mrudulabhalke75917@gmail.com" 
              className="flex items-center gap-3 text-lg hover:text-primary transition-colors"
            >
              <Mail className="h-5 w-5" />
              <span>mrudulabhalke75917@gmail.com</span>
            </a>
            <a 
              href="tel:8610475917" 
              className="flex items-center gap-3 text-lg hover:text-primary transition-colors"
            >
              <Phone className="h-5 w-5" />
              <span>8610475917</span>
            </a>
          </div>
        </div>
      </div>
    </InfoPageLayout>
  );
}
