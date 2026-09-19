import Image from "next/image";

export function Brand() {
  return (
    <span className="sd-brand-logo">
      <Image
        src="/brand/snackdesk-transparent.png"
        alt="Snackdesk"
        width={1536}
        height={567}
        sizes="328px"
      />
    </span>
  );
}
