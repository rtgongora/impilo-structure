import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordValidatorProps {
  password: string;
  onValidationChange?: (isValid: boolean) => void;
}

const PasswordValidator: React.FC<PasswordValidatorProps> = ({ 
  password, 
  onValidationChange 
}) => {
  const [policy, setPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasswordPolicy();
  }, []);

  const fetchPasswordPolicy = async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'password_min_length',
        'password_require_uppercase',
        'password_require_lowercase',
        'password_require_number',
        'password_require_special'
      ]);

    if (!error && data) {
      const getValue = (key: string, defaultVal: string) => {
        const item = data.find(s => s.key === key);
        return item?.value ? String(item.value) : defaultVal;
      };
      
      const newPolicy: PasswordPolicy = {
        minLength: parseInt(getValue('password_min_length', '8'), 10),
        requireUppercase: getValue('password_require_uppercase', 'true') === 'true',
        requireLowercase: getValue('password_require_lowercase', 'true') === 'true',
        requireNumber: getValue('password_require_number', 'true') === 'true',
        requireSpecial: getValue('password_require_special', 'false') === 'true',
      };
      setPolicy(newPolicy);
    }
    setLoading(false);
  };

  const getRequirements = (): PasswordRequirement[] => {
    const requirements: PasswordRequirement[] = [
      {
        label: `At least ${policy.minLength} characters`,
        met: password.length >= policy.minLength,
      },
    ];

    if (policy.requireUppercase) {
      requirements.push({
        label: 'One uppercase letter (A-Z)',
        met: /[A-Z]/.test(password),
      });
    }

    if (policy.requireLowercase) {
      requirements.push({
        label: 'One lowercase letter (a-z)',
        met: /[a-z]/.test(password),
      });
    }

    if (policy.requireNumber) {
      requirements.push({
        label: 'One number (0-9)',
        met: /[0-9]/.test(password),
      });
    }

    if (policy.requireSpecial) {
      requirements.push({
        label: 'One special character (!@#$%...)',
        met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      });
    }

    return requirements;
  };

  const requirements = getRequirements();
  const allMet = requirements.every(r => r.met);
  const strength = requirements.filter(r => r.met).length / requirements.length;

  useEffect(() => {
    onValidationChange?.(allMet);
  }, [allMet, onValidationChange]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading password requirements...
      </div>
    );
  }

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            strength < 0.5 ? "text-destructive" :
            strength < 1 ? "text-yellow-500" :
            "text-green-500"
          )}>
            {strength < 0.5 ? 'Weak' : strength < 1 ? 'Medium' : 'Strong'}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              strength < 0.5 ? "bg-destructive" :
              strength < 1 ? "bg-yellow-500" :
              "bg-green-500"
            )}
            style={{ width: `${strength * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="grid grid-cols-1 gap-1">
        {requirements.map((req, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.met ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <X className="w-3 h-3 text-muted-foreground/50" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordValidator;
