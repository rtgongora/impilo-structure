/**
 * Client Registry Reports
 * Standard and custom reporting for the registry
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Download,
  FileText,
  Calendar,
  Users,
  MapPin,
  GitMerge,
  Activity,
  Clock,
} from 'lucide-react';

const STANDARD_REPORTS = [
  {
    id: 'registrations',
    name: 'New Registrations Report',
    description: 'Health IDs issued within a date range',
    icon: Users,
    frequency: 'Daily/Weekly/Monthly',
  },
  {
    id: 'province-distribution',
    name: 'Geographic Distribution',
    description: 'Client distribution by province and district',
    icon: MapPin,
    frequency: 'Monthly',
  },
  {
    id: 'duplicate-analysis',
    name: 'Duplicate Analysis',
    description: 'Suspected duplicates and resolution rates',
    icon: GitMerge,
    frequency: 'Weekly',
  },
  {
    id: 'lifecycle-summary',
    name: 'Lifecycle Status Summary',
    description: 'Breakdown by active, inactive, deceased, merged',
    icon: Activity,
    frequency: 'Monthly',
  },
  {
    id: 'verification-status',
    name: 'Identity Verification Status',
    description: 'Verified vs unverified identities',
    icon: Clock,
    frequency: 'Weekly',
  },
  {
    id: 'identifier-coverage',
    name: 'Identifier Coverage',
    description: 'National ID, passport, birth registration linkage rates',
    icon: FileText,
    frequency: 'Monthly',
  },
];

export function ClientRegistryReports() {
  return (
    <div className="space-y-6">
      {/* Standard Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Standard Reports
          </CardTitle>
          <CardDescription>
            Pre-configured reports for common registry analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STANDARD_REPORTS.map((report) => (
              <div key={report.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <report.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {report.description}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {report.frequency}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Custom Report Builder
          </CardTitle>
          <CardDescription>
            Create custom queries and exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Custom report builder</p>
            <p className="text-sm">Select fields, filters, and export format</p>
            <Button className="mt-4" variant="outline">
              Create Custom Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Reports
          </CardTitle>
          <CardDescription>
            Automated report generation and distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scheduled reports configured</p>
            <Button className="mt-4" variant="outline">
              Schedule a Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
