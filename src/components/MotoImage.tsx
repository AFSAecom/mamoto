"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface MotoImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string;
  alt: string;
}

export function MotoImage({ src, alt, ...props }: MotoImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <div className={`w-full h-full bg-gray-200 ${props.className ?? ""}`} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={() => setError(true)}
      {...props}
    />
  );
}

export default MotoImage;
