"use client";

import { useState } from "react";
import Image from "next/image";
import { getTeamLogo } from "@/lib/teamLogos";
import { Sport } from "@/lib/types";

interface Props {
  teamName: string;
  sport: Sport;
  fallbackClass: string;
}

export function TeamLogo({ teamName, sport, fallbackClass }: Props) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getTeamLogo(teamName, sport);

  if (!logoUrl || hasError) {
    return (
      <div className={`w-11 h-11 rounded-xl ${fallbackClass} flex items-center justify-center text-lg font-bold text-white shadow-sm`}>
        {teamName.charAt(0)}
      </div>
    );
  }

  return (
    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden border border-gray-100">
      <Image
        src={logoUrl}
        alt={teamName}
        width={36}
        height={36}
        className="object-contain"
        onError={() => setHasError(true)}
        unoptimized
      />
    </div>
  );
}
