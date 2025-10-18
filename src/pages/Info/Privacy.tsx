import { InfoPageLayout } from './InfoPageLayout';

export default function PrivacyPage() {
  return (
    <InfoPageLayout title="Privacy Policy">
      <p className="text-sm text-muted-foreground mb-6">Last updated: October 18, 2025</p>
      
      <p className="mb-4">
        Dr. Mrudula Bhalke operates the AIMedNet website 
        (the "Service"). This page informs you of our policies regarding the 
        collection, use, and disclosure of personal data when you use our Service 
        and the choices you have associated with that data.
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">1. Information Collection and Use</h3>
      <p className="mb-4">
        We collect several different types of information for various purposes to 
        provide and improve our Service to you.
      </p>
      <h4 className="text-xl font-semibold mt-6 mb-3">Types of Data Collected</h4>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>
          <strong>Personal Data:</strong> While using our Service, we may ask you to 
          provide us with certain personally identifiable information, including 
          but not limited to: Email address, First name and last name, Phone number, 
          Professional registration details (e.g., medical license number), 
          specialty, and place of work.
        </li>
        <li>
          <strong>Usage Data:</strong> We may also collect information on how the 
          Service is accessed and used. This may include your computer's IP address, 
          browser type, pages visited, and other diagnostic data.
        </li>
      </ul>

      <h3 className="text-2xl font-semibold mt-8 mb-4">2. Use of Data</h3>
      <p className="mb-4">AIMedNet uses the collected data for various purposes:</p>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>To provide and maintain our Service.</li>
        <li>To verify your identity as a healthcare professional.</li>
        <li>To notify you about changes to our Service.</li>
        <li>To allow you to participate in interactive features (Spaces, Messaging).</li>
        <li>To provide customer support and respond to your inquiries.</li>
        <li>To monitor the usage of our Service to detect and prevent technical issues.</li>
        <li>To prevent fraud and enforce our Code of Conduct.</li>
      </ul>

      <h3 className="text-2xl font-semibold mt-8 mb-4">3. Data Security</h3>
      <p className="mb-4">
        The security of your data is critical to us. We use industry-standard 
        security measures, including encryption and secure server infrastructure 
        (like Supabase), to protect your information. However, no method of 
        transmission over the Internet or method of electronic storage is 100% 
        secure.
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">4. Your Data Rights</h3>
      <p className="mb-4">
        You have the right to access, update, or delete the personal information 
        we have on you. You can do this at any time by accessing your Profile Page 
        settings. If you are unable to perform these actions yourself, please 
        contact us for assistance.
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">5. Changes to This Privacy Policy</h3>
      <p className="mb-4">
        We may update our Privacy Policy from time to time. We will notify you of 
        any changes by posting the new Privacy Policy on this page and updating the 
        "Last updated" date.
      </p>
      
      <h3 className="text-2xl font-semibold mt-8 mb-4">6. Contact Us</h3>
      <p>
        If you have any questions about this Privacy Policy, please contact us at: 
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
