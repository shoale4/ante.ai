"use client";

import { useState, useEffect } from "react";

interface Props {
  timestamp: string | null;
}

export function LastUpdated({ timestamp }: Props) {
  const [relativeTime, setRelativeTime] = useState<string>("");

  useEffect(() => {
    if (!timestamp) {
      setRelativeTime("");
      return;
    }

    const updateRelativeTime = () => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) {
        setRelativeTime("just now");
      } else if (diffMins < 60) {
        setRelativeTime(`${diffMins}m ago`);
      } else if (diffHours < 24) {
        setRelativeTime(`${diffHours}h ago`);
      } else {
        setRelativeTime(`${diffDays}d ago`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp || !relativeTime) return null;

  return (
    <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
      Updated {relativeTime}
    </span>
  );
}
