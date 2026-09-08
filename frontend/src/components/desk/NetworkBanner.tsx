import { AlertTriangle } from "lucide-react";

/**
 * Wrong-network banner (frontend contract §4). Warning gold on a glassy amber
 * ground — never red, never a dead button. Offers the switch inline.
 */
export function NetworkBanner({
  targetName,
  onSwitch,
}: {
  targetName: string;
  onSwitch: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-btn border p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
      style={{
        background:
          "color-mix(in srgb, #E8B84A 8%, rgba(255,255,255,0.04))",
        borderColor: "color-mix(in srgb, #E8B84A 30%, transparent)",
      }}
    >
      <div className="flex items-start gap-2.5" style={{ color: "#E8B84A" }}>
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold">Wrong network</p>
          <p className="text-[13px] font-light opacity-80">
            Switch to {targetName}.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSwitch}
        className="h-9 shrink-0 rounded-btn px-4 text-sm font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
        style={{ background: "#E8B84A", color: "#2A2108" }}
      >
        Switch network
      </button>
    </div>
  );
}
