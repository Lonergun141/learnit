import { Blueprint } from "@/components/ui/blueprint";
import { Tile } from "@/components/ui/tile";

import { SaveLinkForm } from "./save-link-form";

/**
 * The reason the page exists, so it takes the largest cell and is the only
 * textured surface on the grid. Every other tile stays flat, which is what
 * makes this one read as primary without needing a colour or a border weight.
 */
export function CaptureTile({ className }: { className?: string }) {
  return (
    <Tile label="Capture" className={className}>
      <div className="grid-field absolute inset-0 opacity-[0.14]" aria-hidden="true" />
      <Blueprint
        variant="orbit"
        className="absolute -bottom-8 -right-16 h-40 w-72 text-signal/[0.09]"
      />
      <div className="relative max-w-md">
        <SaveLinkForm />
      </div>
    </Tile>
  );
}
