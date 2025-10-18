import { InfoPageLayout } from './InfoPageLayout';

export default function CookiesPage() {
  return (
    <InfoPageLayout title="Cookie Policy">
      <p className="text-sm text-muted-foreground mb-6">Last updated: October 18, 2025</p>
      
      <p className="mb-4">
        AIMedNet uses cookies and similar tracking technologies to track the 
        activity on our Service and hold certain information.
      </p>
      <p className="mb-4">
        Cookies are files with a small amount of data which may include an 
        anonymous unique identifier. They are sent to your browser from a website 
        and stored on your device.
      </j>

      <h3 className="text-2xl font-semibold mt-8 mb-4">How We Use Cookies</h3>
      <p className="mb-4">We use cookies for essential purposes, such as:</p>
      <ul className="list-disc list-inside space-y-2 mb-4">
        <li>
          <strong>Authentication:</strong> To keep you logged in. When you sign in 
          to AIMedNet, we use cookies to remember who you are so you don't have to 
          log in every time you visit a new page.
        </li>
        <li>
          <strong>Security:</strong> To help detect and fight fraud and abuse, 
          and to protect your data.
        </li>
        <li>
          <strong>Preferences:</strong> To remember your settings and preferences 
          (like your choice of dark or light mode).
        </li>
      </ul>

      <h3 className="text-2xl font-semibold mt-8 mb-4">Your Choices</h3>
      <p className="mb-4">
        Our use of authentication and security cookies is essential for the 
        operation of the Service. By using AIMedNet, you agree to our use of these 
        essential cookies.
      </p>
      <p className="mb-4">
        Most web browsers allow you to manage your cookie preferences. You can set 
        your browser to refuse cookies, but please note that if you do so, you 
        will not be able to log in or use the AIMedNet Service.
      </p>
    </InfoPageLayout>
  );
}
