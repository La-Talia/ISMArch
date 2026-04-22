import { PageLayout } from "@/components/PageLayout";

const Contact = () => (
  <PageLayout
    title="Contact"
    description="Get in touch with the ArchRax team for support, feedback, or partnership inquiries."
  >
    <h2>Get in touch</h2>
    <p>
      We'd love to hear from you. Whether you've spotted a bug, want to request
      a feature, or just want to share what you've designed, reach out using
      the channel that suits you best.
    </p>

    <h2>Support &amp; feedback</h2>
    <p>
      For general support, bug reports, and feature requests, email us at{" "}
      <a href="mailto:raxitgupta5@gmail.com">raxitgupta5@gmail.com</a>. We try to reply
      within a few business days.
    </p>
    <p>
      When reporting a bug, it helps a lot if you include:
    </p>
    <ul>
      <li>What you were trying to do.</li>
      <li>What happened instead.</li>
      <li>Your browser and operating system.</li>
      <li>A screenshot or short screen recording, if possible.</li>
    </ul>

    <h2>Privacy questions</h2>
    <p>
      For questions about how we handle data, cookies, or advertising,
      see our <a href="/privacy">privacy policy</a> or email{" "}
      <a href="mailto:raxitgupta5@gmail.com">raxitgupta5@gmail.com</a>.
    </p>

    <h2>Business &amp; partnerships</h2>
    <p>
      For partnership, sponsorship, or licensing inquiries, please email{" "}
      <a href="mailto:raxitgupta5@gmail.com">raxitgupta5@gmail.com</a> with "Partnership"
      in the subject line.
    </p>
  </PageLayout>
);

export default Contact;
