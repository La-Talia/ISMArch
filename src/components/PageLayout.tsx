import * as React from "react";
import { Link } from "react-router-dom";
import { SiteFooter } from "./SiteFooter";
import { AdSlot } from "./AdSlot";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

const ADSENSE_CLIENT = "ca-pub-1451910682418409";
const ADSENSE_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

/**
 * Shared layout for static info pages (about, privacy, terms, etc.).
 *
 * The AdSense loader script is injected here — NOT in index.html — so it only
 * runs on pages that have substantial publisher content (articles). The
 * editor route is a tool/behavioral surface and Google policy forbids ads on
 * such screens, so we keep the loader off of it entirely.
 */
export const PageLayout: React.FC<Props> = ({ title, description, children }) => {
  React.useEffect(() => {
    document.title = `${title} — ArchRax`;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", window.location.origin + window.location.pathname);

    // Inject AdSense loader once, only on content pages.
    if (!document.querySelector(`script[src^="${ADSENSE_SRC}"]`)) {
      const s = document.createElement("script");
      s.async = true;
      s.crossOrigin = "anonymous";
      s.src = ADSENSE_SRC;
      document.head.appendChild(s);
    }
  }, [title, description]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 text-base font-semibold">
            ArchRax
          </Link>
          <nav className="flex items-center gap-1 text-xs">
            <Link to="/help"><Button variant="ghost" size="sm">Help</Button></Link>
            <Link to="/about"><Button variant="ghost" size="sm">About</Button></Link>
            <Link to="/contact"><Button variant="ghost" size="sm">Contact</Button></Link>
            <Link to="/"><Button size="sm"><ArrowLeft className="mr-1 h-3 w-3" />Open editor</Button></Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mb-8 text-muted-foreground">{description}</p>}
          <div className="prose prose-sm max-w-none text-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline">
            {children}
          </div>
          {/* In-article ad slot. Only renders when a real slot ID is configured. */}
          <div className="mt-10">
            <AdSlot slot={import.meta.env.VITE_ADSENSE_SLOT_ARTICLE} minHeight={250} />
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
};
