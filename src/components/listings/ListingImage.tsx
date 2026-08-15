import { ImageOff } from "lucide-react";
import { useState } from "react";

export function ListingImage({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} — photo unavailable`}
        className={`flex items-center justify-center bg-secondary text-muted-foreground ${className ?? ""}`}
      >
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
