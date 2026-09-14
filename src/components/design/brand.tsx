import Image from "next/image";

/** Replace these paths with the approved brand assets when provided. */
export const brandAssets: {
  horizontal: string | null;
  mark: string | null;
  light: string | null;
} = {
  horizontal: "/brand/snackdesk-horizontal-cream.png",
  mark: null,
  light: null,
};

export function Brand({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  const asset = compact
    ? brandAssets.mark
    : light
      ? brandAssets.light || brandAssets.horizontal
      : brandAssets.horizontal;
  if (asset && asset === brandAssets.horizontal && !light)
    return (
      <span className="sd-brand-tile">
        <Image
          src={asset}
          alt="Snackdesk"
          width={2036}
          height={772}
          sizes="250px"
        />
      </span>
    );
  return asset ? (
    <Image
      className="sd-brand-asset"
      src={asset}
      alt="Snackdesk"
      width={compact ? 40 : 180}
      height={40}
    />
  ) : (
    <span className={`sd-wordmark ${light ? "light" : ""}`}>Snackdesk</span>
  );
}
