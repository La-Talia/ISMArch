import { PageLayout } from "@/components/PageLayout";

const Terms = () => (
  <PageLayout
    title="Terms of Service"
    description="The terms governing your use of the ArchRax floor plan editor."
  >
    <p><strong>Last updated:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

    <p>
      These Terms of Service ("Terms") govern your access to and use of
      ArchRax (the "Service"). By using the Service, you agree to these Terms.
      If you do not agree, do not use the Service.
    </p>

    <h2>1. Use of the Service</h2>
    <p>
      ArchRax provides a browser-based tool for sketching floor plans. You may
      use the Service for personal or commercial purposes, subject to these
      Terms and applicable law.
    </p>

    <h2>2. Your content</h2>
    <p>
      You retain all rights to the floor plans, sketches, and other content
      you create with the Service ("Your Content"). Because Your Content is
      stored locally in your browser, we do not claim any rights to it.
    </p>

    <h2>3. Acceptable use</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Use the Service to violate any law or third-party rights.</li>
      <li>Attempt to interfere with, disrupt, or reverse-engineer the Service.</li>
      <li>Use automated means to access the Service in a way that imposes an unreasonable load.</li>
      <li>Use the Service to distribute malware or harmful code.</li>
    </ul>

    <h2>4. Intellectual property</h2>
    <p>
      The Service, including its software, design, and trademarks, is owned by
      ArchRax or its licensors and is protected by intellectual property laws.
      Except for the rights expressly granted, no rights are transferred to you.
    </p>

    <h2>5. Third-party services</h2>
    <p>
      The Service may include links to or integrations with third-party
      services (for example, advertising networks). We are not responsible for
      the content or practices of those third parties. Your use of them is
      governed by their own terms.
    </p>

    <h2>6. Disclaimer</h2>
    <p>
      The Service is provided <strong>"as is"</strong> and <strong>"as available"</strong>{" "}
      without warranties of any kind, express or implied, including
      merchantability, fitness for a particular purpose, and non-infringement.
      Floor plans created with the Service are sketches and should not be
      relied upon for construction, engineering, or legal decisions without
      review by a qualified professional.
    </p>

    <h2>7. Limitation of liability</h2>
    <p>
      To the maximum extent permitted by law, ArchRax and its contributors
      will not be liable for any indirect, incidental, special, consequential,
      or punitive damages, or any loss of data, profits, or goodwill, arising
      from your use of the Service.
    </p>

    <h2>8. Termination</h2>
    <p>
      We may suspend or terminate access to the Service at any time, with or
      without notice, for any reason, including violation of these Terms.
    </p>

    <h2>9. Changes</h2>
    <p>
      We may update these Terms from time to time. Continued use of the
      Service after changes take effect constitutes acceptance of the updated
      Terms.
    </p>

    <h2>10. Contact</h2>
    <p>
      Questions about these Terms? Email{" "}
      <a href="mailto:raxitgupta5@gmail.com">raxitgupta5@gmail.com</a>.
    </p>
  </PageLayout>
);

export default Terms;
