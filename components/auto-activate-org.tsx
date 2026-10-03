"use client";

import { useOrganizationList } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface AutoActivateOrgProps {
  targetOrgId: string;
}

export function AutoActivateOrg({ targetOrgId }: AutoActivateOrgProps) {
  const { setActive, isLoaded } = useOrganizationList();
  const router = useRouter();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!isLoaded || !setActive || !targetOrgId || hasTriggered.current) {
      return;
    }

    hasTriggered.current = true;
    setActive({ organization: targetOrgId }).then(() => {
      router.refresh();
    });
  }, [isLoaded, setActive, targetOrgId, router]);

  return null;
}
