import * as React from "react";

/**
 * Reserved ad container.
 *
 * Renders nothing (just keeps reserved layout space) until a Google AdSense
 * publisher ID is configured via the VITE_ADSENSE_CLIENT environment variable
 * AND a valid `slot` prop is provided. This is intentional: showing fake
 * "Your Ad Here" boxes that look like ads violates Google's deceptive-content
 * policies and is a common reason AdSense applications are rejected.
 *
 * Once approved, set:
 *   VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
 * and pass a real `slot` ID to render real ads.
 */
type Props = {
  slot?: string;
  format?: string;
  className?: string;
  /** Min height in px to reserve so layout doesn't shift later. */
  minHeight?: number;
  /** Short label shown above the slot (e.g. "Advertisement"). Required by AdSense if slot is live. */
  label?: string;
};

const CLIENT = "ca-pub-1451910682418409";

export const AdSlot: React.FC<Props> = ({
  slot,
  format = "auto",
  className = "",
  minHeight = 90,
  label = "Advertisement",
}) => {
  const ref = React.useRef<HTMLModElement | null>(null);
  const live = Boolean(CLIENT && slot);

  React.useEffect(() => {
    if (!live) return;
    try {
      // @ts-expect-error adsbygoogle is injected globally by the AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* no-op */
    }
  }, [live]);

  // When not live, reserve space silently. No fake "ad here" text.
  if (!live) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div className={className}>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", minHeight }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
