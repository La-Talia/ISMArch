import { PageLayout } from "@/components/PageLayout";

const Cookies = () => (
  <PageLayout
    title="Cookie Policy"
    description="How ArchRax uses cookies and similar technologies, and how to control them."
  >
    <p><strong>Last updated:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

    <h2>What are cookies?</h2>
    <p>
      Cookies are small text files placed on your device by websites you
      visit. They are widely used to make websites work, to make them work
      more efficiently, and to provide information to the site owners.
    </p>

    <h2>How we use cookies</h2>
    <p>ArchRax uses the following categories of cookies and similar technologies:</p>
    <ul>
      <li>
        <strong>Strictly necessary:</strong> required for the Service to
        function, such as remembering your editor preferences and storing your
        floor-plan projects in your browser's local storage.
      </li>
      <li>
        <strong>Analytics:</strong> help us understand how visitors use the
        Service so we can improve it. These cookies collect aggregated and
        anonymized information.
      </li>
      <li>
        <strong>Advertising:</strong> set by third-party ad partners, including{" "}
        <strong>Google AdSense</strong>, to deliver and measure ads, and (where
        permitted) to personalize them based on your interests.
      </li>
    </ul>

    <h2>Third-party cookies</h2>
    <p>
      Some cookies are set by third parties whose services we use. These
      include Google for advertising and analytics. Google may use cookies to
      serve ads based on your visits to this and other sites. You can learn
      more and opt out of personalized advertising at{" "}
      <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
    </p>

    <h2>Managing cookies</h2>
    <p>
      You can control or delete cookies through your browser settings. Most
      browsers let you refuse cookies, accept them only from specific sites, or
      delete cookies that have already been set. Note that disabling some
      cookies may affect the functionality of the Service.
    </p>
    <p>
      Useful links: {" "}
      <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a>,{" "}
      <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Firefox</a>,{" "}
      <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a>,{" "}
      <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge</a>.
    </p>

    <h2>Updates</h2>
    <p>
      We may update this Cookie Policy from time to time. The latest version
      will always be available on this page.
    </p>
  </PageLayout>
);

export default Cookies;
