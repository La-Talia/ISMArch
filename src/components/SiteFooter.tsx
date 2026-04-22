import { Link } from "react-router-dom";

export const SiteFooter = () => {
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">ArchRax</h3>
            <p className="text-xs text-muted-foreground">
              A free, browser-based floor plan editor. Sketch plots, design
              rooms, place furniture, and export your plans as PNG, PDF, or DXF.
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Product</h3>
            <ul className="space-y-1 text-xs">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground">Editor</Link></li>
              <li><Link to="/help" className="text-muted-foreground hover:text-foreground">Help & guide</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Legal</h3>
            <ul className="space-y-1 text-xs">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms of service</Link></li>
              <li><Link to="/cookies" className="text-muted-foreground hover:text-foreground">Cookie policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Contact</h3>
            <ul className="space-y-1 text-xs">
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">Contact us</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-2 border-t pt-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ArchRax. All rights reserved.</p>
          <p>Built for architects, designers, and homeowners.</p>
        </div>
      </div>
    </footer>
  );
};
