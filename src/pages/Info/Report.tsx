import { InfoPageLayout } from './InfoPageLayout';
import { Link } from 'react-router-dom';

export default function ReportPage() {
  return (
    <InfoPageLayout title="Report Content or Behavior">
      <p className="text-lg text-muted-foreground mb-6">
        AIMedNet is committed to maintaining a professional and respectful environment. 
        If you encounter content or behavior that violates our policies, please let us know.
      </p>
      <div className="p-6 bg-card border border-border rounded-radius-lg">
        <h3 className="text-xl font-semibold mb-4">How to Make a Report</h3>
        <p className="mb-4">
          To report a user, a post, a comment, or a message, please send an email 
          to our moderation team with the following details:
        </p>
        <ul className="list-disc list-inside space-y-2 mb-6">
          <li><strong>Link:</strong> A direct URL to the content or user profile in question.</li>
          <li><strong>Reason:</strong> A brief description of why you are reporting it (e.g., "Spam," "Harassment," "Misinformation").</li>
          <li><strong>Details:</strong> Any additional context that might help our review.</li>
        </ul>
        <h4 className="font-semibold">Send all reports to:</h4>
        <a 
          href="mailto:mrudulabhalke75917@gmail.com?subject=AIMedNet Content Report" 
          className="text-lg text-primary font-medium hover:underline"
        >
          mrudulabhalke75917@gmail.com
        </a>
        <p className="text-sm text-muted-foreground mt-4">
          All reports are confidential. Our team will review the case and take 
          appropriate action based on our {' '}
          <Link
            to="/info/code-of-conduct"
            className="text-primary hover:underline"
          >
            Code of Conduct
          </Link>{' '}
          and
          {/* Use Link component here */}
          <Link to="/info/terms" className="text-primary hover:underline ml-1">
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </InfoPageLayout>
  );
}
