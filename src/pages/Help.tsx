import { PageLayout } from "@/components/PageLayout";

const Help = () => (
  <PageLayout
    title="Help & Guide"
    description="Learn how to use ArchRax: sketch a plot, add walls, place furniture, measure areas, and export plans."
  >
    <p>
      This guide walks you through everything you need to design a complete
      floor plan in ArchRax — from sketching your plot to exporting a CAD-ready
      file. If you're new, work through the sections in order; otherwise, jump
      to whatever you need.
    </p>

    <h2>1. Starting a project</h2>
    <p>
      When you open ArchRax for the first time, the plot sketcher appears
      automatically. You can also start a new project at any time by clicking{" "}
      <strong>New</strong> in the header.
    </p>
    <h3>Polygon mode</h3>
    <p>
      Click points on the canvas to define the corners of your plot. Press{" "}
      <strong>Enter</strong> or click the first point again to close the shape.
      Use this mode for rectangular or surveyed plots where you know the
      corners.
    </p>
    <h3>Freehand mode</h3>
    <p>
      Click and drag to trace the outline of your plot. Freehand is best for
      irregular plots where you're tracing a survey image or rough sketch.
    </p>

    <h2>2. Drawing walls, doors, and windows</h2>
    <p>
      With the editor open, use the toolbar to add elements:
    </p>
    <ul>
      <li><strong>Wall:</strong> adds a wall in the center of the canvas. Drag the endpoints to position it.</li>
      <li><strong>Door / Window:</strong> select an existing wall first, then click Door or Window. Adjust the position and width in the right-hand properties panel.</li>
      <li><strong>Room:</strong> drops a labeled room rectangle you can move and resize.</li>
    </ul>
    <p>
      Hold <strong>Shift</strong> while dragging to constrain to horizontal,
      vertical, or 45° angles. Toggle the <strong>magnet</strong> button in the
      toolbar to snap to nearby walls and corners.
    </p>

    <h2>3. Working with multiple floors</h2>
    <p>
      Click <strong>Add Floor</strong> in the floor tabs to create another
      level. New floors inherit the exterior walls of the previous floor so
      your building stays aligned. Double-click a tab name to rename it
      (e.g. "Ground", "First", "Roof").
    </p>

    <h2>4. Measuring</h2>
    <h3>Custom dimensions</h3>
    <p>
      Switch to the <strong>dimension tool</strong> (ruler icon) in the
      toolbar, then click two points to add a dimension line. Drag the label
      perpendicular to the line to offset it. Click any dimension number to
      type an exact length and the geometry will adjust to match.
    </p>
    <h3>Enclosed area</h3>
    <p>
      Shift-click three or more walls that form a closed loop, then click{" "}
      <strong>Area</strong>. ArchRax computes the enclosed area in square feet
      and highlights the polygon. Doors and windows inside those walls are
      ignored.
    </p>

    <h2>5. Furniture and props</h2>
    <p>
      The left panel contains a library of furniture and fixtures organized by
      category. Click an item to drop it onto the canvas, then drag to
      position and rotate. Use the right-hand properties panel to fine-tune
      size and rotation.
    </p>

    <h2>6. Exporting your plan</h2>
    <ul>
      <li><strong>PNG:</strong> a high-resolution raster image, good for sharing.</li>
      <li><strong>PDF:</strong> the same image inside a PDF page sized to fit.</li>
      <li><strong>DXF:</strong> a CAD-compatible vector file. Choose whether to include or exclude furniture so the recipient gets exactly the layers they need.</li>
      <li><strong>.archrax:</strong> the native project format. Use this to back up a project or share it with another ArchRax user.</li>
    </ul>

    <h2>7. Saving and loading projects</h2>
    <p>
      All projects are auto-saved to your browser's local storage on the
      device you're using. They are not uploaded to a server. To move a
      project to another device, export it as <strong>.archrax</strong> and
      import it on the other side.
    </p>

    <h2>8. Keyboard shortcuts</h2>
    <ul>
      <li><strong>Ctrl/Cmd + Z:</strong> undo</li>
      <li><strong>Ctrl/Cmd + Shift + Z</strong> or <strong>Ctrl/Cmd + Y</strong>: redo</li>
      <li><strong>Delete</strong> / <strong>Backspace</strong>: delete the current selection</li>
      <li><strong>Shift</strong> while dragging: constrain angle</li>
    </ul>

    <h2>9. Troubleshooting</h2>
    <p>
      <strong>My project disappeared.</strong> Local storage can be cleared by
      browser settings, private/incognito windows, or "clear browsing data".
      Always export important projects as <strong>.archrax</strong> for backup.
    </p>
    <p>
      <strong>Export looks blurry.</strong> Use the PDF or DXF export for
      print-quality output. PNG is bitmap and depends on screen resolution.
    </p>
    <p>
      Still stuck? Visit our <a href="/contact">contact page</a> and tell us
      what happened.
    </p>
  </PageLayout>
);

export default Help;
