import { PageLayout } from "@/components/PageLayout";

const About = () => (
  <PageLayout
    title="About ArchRax"
    description="ArchRax is a free, browser-based floor plan editor for sketching plots, designing rooms, and exporting plans."
  >
    <h2>What is ArchRax?</h2>
    <p>
      ArchRax is a lightweight, browser-based floor plan editor built for
      homeowners, students, interior designers, and small architecture studios
      who need to sketch a plot boundary and lay out floor plans quickly,
      without installing CAD software.
    </p>
    <p>
      The editor runs entirely in your browser. Projects are saved to your
      device's local storage, so your work stays with you and there is no
      account, login, or cloud upload required to start designing.
    </p>

    <h2>What you can do with it</h2>
    <ul>
      <li>Sketch a plot boundary as a polygon or freehand shape.</li>
      <li>Add walls, doors, windows, rooms, and stairs across multiple floors.</li>
      <li>Place furniture and fixtures from a built-in prop library.</li>
      <li>Add custom dimensions and measure enclosed areas.</li>
      <li>Export to PNG, PDF, or DXF (with or without furniture) for sharing or CAD use.</li>
      <li>Save projects locally and switch between them at any time.</li>
    </ul>

    <h2>Who is it for?</h2>
    <p>
      ArchRax is intended for early-stage planning and concept work — the kind
      of layout you might otherwise sketch on graph paper. It is well suited
      for visualizing room sizes, planning furniture placement, communicating
      ideas with a contractor, or producing a clean DXF file to hand off to a
      professional drafter.
    </p>

    <h2>How it's built</h2>
    <p>
      ArchRax is built with React, TypeScript, and Tailwind CSS, with an SVG
      canvas for rendering. All editing logic runs client-side, which is why
      the app stays fast and works offline once loaded.
    </p>

    <h2>Feedback</h2>
    <p>
      Found a bug or have a feature request? Visit our{" "}
      <a href="/contact">contact page</a> — feedback from real users is what
      shapes the roadmap.
    </p>
  </PageLayout>
);

export default About;
