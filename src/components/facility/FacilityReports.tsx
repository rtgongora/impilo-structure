/**
 * Facility Registry Reports
 * Standard and custom reports for facility data
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Download, 
  FileText,
  PieChart,
  Map,
  Calendar,
  Filter,
  Building2,
} from 'lucide-react';

export const FacilityReports = () => {
  const reports = [
    {
      id: 'mfl-complete',
      name: 'Complete Master Facility List',
      description: 'Full export of all approved facilities with complete attributes',
      icon: FileText,
      format: 'CSV / Excel',
      lastGenerated: '2024-01-20',
    },
    {
      id: 'by-province',
      name: 'Facilities by Province',
      description: 'Distribution of facilities across provinces with counts',
      icon: Map,
      format: 'PDF',
      lastGenerated: '2024-01-19',
    },
    {
      id: 'by-type',
      name: 'Facilities by Type',
      description: 'Breakdown of facilities by type and level of care',
      icon: PieChart,
      format: 'PDF',
      lastGenerated: '2024-01-18',
    },
    {
      id: 'service-availability',
      name: 'Service Availability Matrix',
      description: 'Which services are available at which facilities',
      icon: BarChart3,
      format: 'Excel',
      lastGenerated: '2024-01-17',
    },
    {
      id: 'changes-log',
      name: 'Change Log Report',
      description: 'All changes made to the facility registry in a period',
      icon: Calendar,
      format: 'PDF',
      lastGenerated: '2024-01-16',
    },
    {
      id: 'data-quality',
      name: 'Data Quality Report',
      description: 'Completeness and validation status of facility records',
      icon: Filter,
      format: 'PDF',
      lastGenerated: '2024-01-15',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">98.5%</p>
                <p className="text-xs text-muted-foreground">Data Completeness</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Map className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-xs text-muted-foreground">Geo-coded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-xs text-muted-foreground">Available Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standard Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Standard Reports</CardTitle>
          <CardDescription>Pre-configured reports for common facility registry queries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {reports.map(report => (
              <div key={report.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <report.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{report.format}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Last: {report.lastGenerated}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
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
          <CardTitle className="text-lg">Custom Report Builder</CardTitle>
          <CardDescription>Create custom reports with specific filters and columns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 border-2 border-dashed rounded-lg text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Build Custom Report</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select columns, apply filters, and generate custom facility reports
            </p>
            <Button>
              <Filter className="h-4 w-4 mr-2" />
              Open Report Builder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
