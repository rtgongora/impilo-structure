// Registry Admin page — route entry point
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { RegistryAdminWorkspace } from "@/components/registry/RegistryAdminWorkspace";

type RegistryType = "vito" | "varapi" | "tuso" | "tshepo" | "zibo" | "indawo" | "msika";

const RegistryAdmin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const registry = (searchParams.get("registry") || "vito") as RegistryType;

  return (
    <RegistryAdminWorkspace
      registry={registry}
      onBack={() => navigate("/")}
    />
  );
};

export default RegistryAdmin;
