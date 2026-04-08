// Unified Sign-In Component
// Single sign-in form for all user types — providers, patients, staff, admins
// Authentication method is detected automatically based on input

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye, EyeOff, LogIn, Fingerprint, Mail, Phone,
  Shield, ArrowRight, Loader2, KeyRound, Wrench,
} from "lucide-react";
import { ProviderIdLookup } from "./ProviderIdLookup";
import { BiometricAuth } from "./BiometricAuth";
import { type ProviderRegistryRecord, type FacilityRegistryRecord } from "@/services/registryServices";

type SignInMethod = "credentials" | "provider-id" | "biometric-verify";

interface UnifiedSignInProps {
  onAuthenticated: () => void;
  onShowMaintenance?: () => void;
}

export function UnifiedSignIn({ onAuthenticated, onShowMaintenance }: UnifiedSignInProps) {
  const [method, setMethod] = useState<SignInMethod>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Provider ID flow state
  const [provider, setProvider] = useState<ProviderRegistryRecord | null>(null);
  const [facility, setFacility] = useState<FacilityRegistryRecord | null>(null);

  // Maintenance shortcut
  const [showMaintenanceHint, setShowMaintenanceHint] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "M") {
        e.preventDefault();
        setShowMaintenanceHint(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password,
      });
      if (error) {
        toast.error("Login failed", { description: error.message });
        return;
      }
      toast.success("Welcome back!", { description: "Signed in successfully" });
      onAuthenticated();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderFound = (providerData: ProviderRegistryRecord, facilityData: FacilityRegistryRecord) => {
    setProvider(providerData);
    setFacility(facilityData);
    setMethod("biometric-verify");
  };

  const handleBiometricVerified = async (biometricMethod: string, confidence: number) => {
    if (!provider) return;
    try {
      // Demo provider email mapping
      const emailMap: Record<string, string> = {
        "VARAPI-2025-ZW000001-A1B2": "sarah.moyo@impilo.health",
        "VARAPI-2025-ZW000002-C3D4": "tendai.ncube@impilo.health",
        "VARAPI-2025-ZW000003-E5F6": "grace.mutasa@impilo.health",
        "VARAPI-2025-ZW000004-G7H8": "farai.chikwava@impilo.health",
        "VARAPI-2025-ZW000005-I9J0": "rumbi.mhaka@impilo.health",
      };
      const providerEmail = emailMap[provider.providerId];
      if (!providerEmail) {
        toast.error("Demo login not available for this provider");
        setMethod("provider-id");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: providerEmail,
        password: "Impilo2025!",
      });
      if (error) {
        toast.error("Authentication failed", { description: error.message });
        return;
      }
      toast.success(`Welcome, ${provider.fullName}!`);
      onAuthenticated();
    } catch (error) {
      console.error("Biometric auth error:", error);
      toast.error("Failed to complete authentication");
    }
  };

  const handleBiometricFailed = (error: string) => {
    toast.error("Verification failed", { description: error });
    setMethod("provider-id");
    setProvider(null);
  };

  // Provider ID + Biometric flow
  if (method === "provider-id") {
    return (
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => setMethod("credentials")} className="mb-4 -ml-2 text-muted-foreground">
            ← Back to sign in
          </Button>
          <h2 className="text-2xl font-bold font-display">Provider Sign In</h2>
          <p className="text-muted-foreground mt-1">Enter your registered Provider ID</p>
        </div>
        <ProviderIdLookup onProviderFound={handleProviderFound} onCancel={() => setMethod("credentials")} />
      </div>
    );
  }

  if (method === "biometric-verify") {
    return (
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => setMethod("provider-id")} className="mb-4 -ml-2 text-muted-foreground">
            ← Back
          </Button>
          <h2 className="text-2xl font-bold font-display">Verify Identity</h2>
          <p className="text-muted-foreground mt-1">
            Biometric verification for <span className="font-medium text-foreground">{provider?.fullName}</span>
          </p>
        </div>
        <BiometricAuth
          providerId={provider!.providerId}
          onVerified={handleBiometricVerified}
          onFailed={handleBiometricFailed}
          onCancel={() => { setMethod("provider-id"); setProvider(null); }}
        />
      </div>
    );
  }

  // Default: unified credentials form
  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h2 className="text-3xl font-bold text-foreground font-display">Sign In</h2>
        <p className="text-muted-foreground mt-2">
          One account for all your health services
        </p>
      </div>

      <form onSubmit={handleCredentialLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-sm font-medium">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="identifier"
              type="email"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="your.name@impilo.health"
              className="pl-10 h-12"
              required
              autoComplete="email"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <a href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="pl-10 pr-10 h-12"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
          ) : (
            <><LogIn className="mr-2 h-4 w-4" /> Sign In</>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or sign in with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-12 gap-2"
          onClick={() => setMethod("provider-id")}
        >
          <Fingerprint className="h-4 w-4" />
          Provider ID
        </Button>
        <Button
          variant="outline"
          className="h-12 gap-2"
          onClick={() => toast.info("Phone/OTP login coming soon")}
        >
          <Phone className="h-4 w-4" />
          Phone / OTP
        </Button>
      </div>

      {/* Maintenance shortcut */}
      {(showMaintenanceHint || onShowMaintenance) && showMaintenanceHint && (
        <Button
          variant="ghost"
          className="w-full text-amber-600 border border-amber-500/30 hover:bg-amber-500/10"
          onClick={onShowMaintenance}
        >
          <Wrench className="mr-2 h-4 w-4" />
          System Maintenance
        </Button>
      )}

      <p className="text-center text-xs text-muted-foreground">
        By signing in, you agree to the platform's terms of use and privacy policy.
      </p>
    </div>
  );
}
