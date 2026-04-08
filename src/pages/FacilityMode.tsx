// Facility Mode page — route entry point
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FacilityModeShell } from "@/components/facility/FacilityModeShell";

const FacilityMode = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Read facility context from session storage or search params
  const storedContext = sessionStorage.getItem("impilo_active_context");
  const context = storedContext ? JSON.parse(storedContext) : null;

  const facilityId = searchParams.get("facilityId") || context?.facilityId || "";
  const facilityName = searchParams.get("facilityName") || context?.facilityName || "Unknown Facility";
  const facilityType = context?.facilityType || "Health Facility";
  const contextLabel = context?.contextLabel || "";

  if (!facilityId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No facility context found.</p>
          <button onClick={() => navigate("/")} className="text-primary underline text-sm">Return home</button>
        </div>
      </div>
    );
  }

  return (
    <FacilityModeShell
      facilityId={facilityId}
      facilityName={facilityName}
      facilityType={facilityType}
      contextLabel={contextLabel}
      onExitFacilityMode={() => navigate("/")}
    />
  );
};

export default FacilityMode;
