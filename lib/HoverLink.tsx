"use client";

import Link, { LinkProps } from "next/link";
import { useState } from "react";

export function HoverPrefetchLink(props: any) {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onMouseEnter={() => setActive(true)}
    />
  );
}
