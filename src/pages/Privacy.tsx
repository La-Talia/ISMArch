import { PageLayout } from "@/components/PageLayout";

const Privacy = () => (
  <PageLayout
    title="Privacy Policy"
    description="How ArchRax handles your data, cookies, and third-party advertising."
  >
    <p><strong>Last updated:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

    <p>
      This Privacy Policy describes how ArchRax ("we", "our", or "us") collects,
      uses, and shares information when you use our website and the floor plan
      editor (collectively, the "Service").
    </p>

    <h2>1. Information we collect</h2>
    <h3>Information you create</h3>
    <p>
      Floor plans, project names, and other content you create in the editor
      are stored <strong>locally in your browser</strong> using your device's
      local storage. We do not upload, transmit, or store these files on our
      servers.
    </p>
    <h3>Information collected automatically</h3>
    <p>
      When you visit the Service, we may automatically collect limited
      technical information such as your browser type, device type, operating
      system, referring page, and pages visited. This information is used to
      monitor performance, fix bugs, and understand how the Service is used.
    </p>

    <h2>2. Cookies and similar technologies</h2>
    <p>
      We and our partners use cookies and similar technologies to operate the
      Service, remember your preferences, measure performance, and serve
      advertising. See our <a href="/cookies">Cookie Policy</a> for more
      information and how to control cookies.
    </p>

    <h2>3. Advertising</h2>
    <p>
      We may use third-party advertising services, including{" "}
      <strong>Google AdSense</strong>, to display ads on the Service. These
      providers may use cookies and device identifiers to serve ads based on
      your prior visits to this and other websites.
    </p>
    <p>
      You can opt out of personalized advertising by visiting{" "}
      <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>{" "}
      or <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">aboutads.info</a>.
      Visitors in the EEA, UK, and Switzerland can manage consent through the
      consent banner where required.
    </p>

    <h2>4. How we use information</h2>
    <ul>
      <li>To operate, maintain, and improve the Service.</li>
      <li>To diagnose technical issues and prevent abuse.</li>
      <li>To measure the performance of features and content.</li>
      <li>To serve and measure advertising.</li>
    </ul>

    <h2>5. Sharing of information</h2>
    <p>
      We do not sell your personal information. We may share limited technical
      information with service providers (such as hosting and analytics
      providers) and advertising partners, strictly to operate the Service.
    </p>

    <h2>6. Data retention</h2>
    <p>
      Project files you create live in your browser's local storage and remain
      until you delete them or clear your browser data. Server-side technical
      logs are retained for a limited period for security and debugging.
    </p>

    <h2>7. Your rights</h2>
    <p>
      Depending on your location, you may have rights to access, correct, or
      delete personal information we hold about you, and to object to or
      restrict certain processing. Contact us at{" "}
      <a href="mailto:privacy@archrax.app">privacy@archrax.app</a> to exercise
      these rights.
    </p>

    <h2>8. Children</h2>
    <p>
      The Service is not directed to children under 13 (or the equivalent
      minimum age in your jurisdiction), and we do not knowingly collect
      personal information from children.
    </p>

    <h2>9. Changes to this policy</h2>
    <p>
      We may update this Privacy Policy from time to time. We will post the
      updated version here and revise the "Last updated" date above.
    </p>

    <h2>10. Contact</h2>
    <p>
      Questions? Email <a href="mailto:privacy@archrax.app">privacy@archrax.app</a>{" "}
      or visit our <a href="/contact">contact page</a>.
    </p>
  </PageLayout>
);

export default Privacy;
