import { InfoPageLayout } from './InfoPageLayout';

export default function TermsPage() {
  return (
    <InfoPageLayout title="Terms of Service">
      <p className="text-sm text-muted-foreground mb-6">Last updated: October 18, 2025</p>

      <p className="mb-4">
        Please read these Terms of Service ("Terms") carefully before using the 
        AIMedNet website (the "Service") operated by Dr. Mrudula Bhalke ("us", "we", "our").
      </p>
      <p className="mb-4">
        Your access to and use of the Service is conditioned on your acceptance of 
        and compliance with these Terms. These Terms apply to all visitors, users, 
        and others who access or use the Service.
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">1. Accounts and Verification</h3>
      <p className="mb-4">
        When you create an account with us, you must provide information that is 
        accurate, complete, and current at all times. Failure to do so constitutes 
        a breach of the Terms.
      </p>
      <p className="mb-4">
        The Service is intended solely for verified healthcare professionals. You 
        agree to submit accurate professional information for verification. We 
        reserve the right to refuse service, terminate accounts, or remove content 
        if we believe verification information is false or misleading.
      </p>
      <p className="mb-4">
        You are responsible for safeguarding the password that you use to access 
        the Service and for any activities or actions under your password.
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">2. User Conduct and Content</h3>
      <p className="mb-4">
        You are solely responsible for all content (posts, messages, files) that 
        you upload, post, or share through the Service. You agree not to post 
        content that:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>Is unlawful, harmful, threatening, abusive, or harassing.</li>
        <li>Violates patient privacy (HIPAA or equivalent local regulations). 
            <strong>You must de-identify all patient information.</strong></li>
        <li>Infringes any patent, trademark, trade secret, copyright, or other 
            proprietary rights of any party.</li>
        <li>Constitutes unauthorized advertising, spam, or promotional materials.</li>
      </ul>
      <p className="mb-4">
        All users are required to adhere to our 
        <a href="/info/code-of-conduct" className="text-primary hover:underline ml-1">Code of Conduct</a>.
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">3. Disclaimers</h3>
      <p className="mb-4">
        The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The content 
        shared on AIMedNet, including medical discussions, is for informational 
        and educational purposes only. It is not a substitute for independent 
        professional medical judgment, diagnosis, or treatment.
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">4. Termination</h3>
      <p className="mb-4">
        We may terminate or suspend your account immediately, without prior notice 
        or liability, for any reason whatsoever, including without limitation if 
        you breach the Terms or our Code of Conduct.
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">5. Governing Law</h3>
      <p className="mb-4">
        These Terms shall be governed and construed in accordance with the laws of 
        India, without regard to its conflict of law provisions.
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">6. Contact Us</h3>
      <p>
        If you have any questions about these Terms, please contact us at:
        <a 
          href="mailto:mrudulabhalke75917@gmail.com" 
          className="text-primary hover:underline ml-2"
        >
          mrudulabhalke75917@gmail.com
        </a>
      </p>
    </InfoPageLayout>
  );
}
