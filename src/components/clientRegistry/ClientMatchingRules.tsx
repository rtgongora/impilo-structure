/**
 * Client Matching Rules Configuration
 * Configure deterministic and probabilistic matching rules
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, 
  Plus,
  Edit,
  Trash2,
  Zap,
  Scale,
} from 'lucide-react';
import { useClientMatchingRules } from '@/hooks/useClientRegistryData';

export function ClientMatchingRules() {
  const { rules, loading } = useClientMatchingRules();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matching Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Identity Matching Configuration
              </CardTitle>
              <CardDescription>
                Configure how the system identifies potential duplicate records
              </CardDescription>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      rule.rule_type === 'deterministic' 
                        ? 'bg-emerald-100' 
                        : 'bg-blue-100'
                    }`}>
                      {rule.rule_type === 'deterministic' ? (
                        <Zap className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Scale className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{rule.rule_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={rule.rule_type === 'deterministic' ? 'default' : 'secondary'}>
                          {rule.rule_type}
                        </Badge>
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                        {rule.threshold && (
                          <Badge variant="outline">Threshold: {rule.threshold}%</Badge>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Fields:</strong>{' '}
                        {Array.isArray(rule.fields) ? rule.fields.join(', ') : JSON.stringify(rule.fields)}
                      </div>
                      {rule.weights && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          <strong>Weights:</strong>{' '}
                          {Object.entries(rule.weights).map(([k, v]) => `${k}: ${v}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Active</span>
                      <Switch checked={rule.is_active} />
                    </div>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Matching Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Matching Thresholds</CardTitle>
          <CardDescription>
            Configure global matching sensitivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Auto-link Threshold</span>
                <Badge>95%</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Records matching above this score are automatically linked
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Review Threshold</span>
                <Badge variant="secondary">75%</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Records between review and auto-link thresholds require manual review
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
