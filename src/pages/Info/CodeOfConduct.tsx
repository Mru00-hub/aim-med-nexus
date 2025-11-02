import { InfoPageLayout } from './InfoPageLayout';
import { Link } from 'react-router-dom';

export default function CodeOfConductPage() {
  return (
    <InfoPageLayout title="Code of Conduct">
      <p className="text-lg text-muted-foreground mb-6">
        AIMedNet is dedicated to providing a professional, respectful, and 
        harassment-free environment for all members, regardless of specialty, 
        experience level, gender, sexual orientation, disability, physical 
        appearance, or race.
      </p>
      <p className="mb-6">
        We do not tolerate harassment in any form. All communication should be 
        professional and constructive. By participating in this community, 
        you agree to abide by these rules.
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">Our Standards</h3>
      <p className="mb-4">
        Examples of behavior that contributes to a positive environment:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>Being respectful of differing viewpoints and experiences.</li>
        <li>Giving and gracefully accepting constructive feedback.</li>
        <li>Focusing on what is best for the professional community.</li>
        <li>Showing empathy towards other community members.</li>
      </ul>

      <h3 className="text-2xl font-semibold mt-8 mb-4">Unacceptable Behavior</h3>
      <p className="mb-4">
        Examples of unacceptable behavior by participants include:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>
          <strong>Patient Privacy Violations:</strong> Never post any Personally 
          Identifiable Information (PII) of a patient. All clinical cases must 
          be fully de-identified.
        </li>
        <li>
          <strong>Harassment:</strong> This includes offensive comments, sexual 
          language, personal attacks, trolling, or insulting/derogatory comments.
        </li>
        <li>
          <strong>Misinformation:</strong> Knowingly spreading false or 
          misleading medical information.
        </li>
        <li>
          <strong>Spam & Promotion:</strong> Unsolicited advertising or 
          self-promotion outside of designated partnership channels.
        </li>
        <li>
          <strong>Other Conduct:</strong> Any other conduct which could 
          reasonably be considered inappropriate in a professional setting.
        </li>
      </ul>

      <h3 className="text-2xl font-semibold mt-8 mb-4">Enforcement</h3>
      <p className="mb-4">
        Users who violate this Code of Conduct will be held accountable. 
        Consequences are at the discretion of the moderation team and may include:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>A formal warning.</li>
        <li>Temporary suspension of the account.</li>
        <li>Permanent removal (ban) from the AIMedNet platform.</li>
      </ul>

      <h3 className="text-2xl font-semibold mt-8 mb-4">Reporting Violations</h3>
      <p>
        If you witness or are subject to unacceptable behavior, please report it 
        immediately to our moderation team.
        <Link
          to="/info/report"
          className="text-primary hover:underline ml-2"
        >
          Click here to report an issue.
        </a>
      </p>
    </InfoPageLayout>
  );
}
