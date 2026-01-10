/**
 * Health ID Manager Component
 * Manages Health ID display, creation, and linking in the portal
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Link2, 
  Users, 
  Search, 
  Edit,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { HealthIdCard } from './HealthIdCard';
import { HealthIdCreationWizard } from './HealthIdCreationWizard';
import { toast } from 'sonner';

// Mock data - in production, this would come from the API
const MOCK_HEALTH_ID = {
  healthId: 'HID-0012345678-XYZQ-1',
  givenNames: 'John',
  familyName: 'Doe',
  dateOfBirth: '1985-03-15',
  sex: 'male',
  phone: '+263 77 123 4567',
  verificationStatus: 'verified' as const,
  biometricEnrolled: true,
};

const MOCK_DEPENDENTS = [
  {
    healthId: 'HID-0098765432-ABCD-1',
    givenNames: 'Sarah',
    familyName: 'Doe',
    dateOfBirth: '2015-08-20',
    sex: 'female',
    relationship: 'child',
    verificationStatus: 'verified' as const,
  },
  {
    healthId: 'HID-0087654321-EFGH-1',
    givenNames: 'Michael',
    familyName: 'Doe',
    dateOfBirth: '2018-11-05',
    sex: 'male',
    relationship: 'child',
    verificationStatus: 'pending' as const,
  },
];

interface HealthIdManagerProps {
  hasHealthId?: boolean;
}

export function HealthIdManager({ hasHealthId = true }: HealthIdManagerProps) {
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [linkingHealthId, setLinkingHealthId] = useState(false);
  const [healthIdToLink, setHealthIdToLink] = useState('');
  const [activeTab, setActiveTab] = useState('my-id');

  const handleLinkHealthId = async () => {
    if (!healthIdToLink.trim()) {
      toast.error('Please enter a Health ID');
      return;
    }
    // Simulate linking
    toast.success('Health ID linked successfully');
    setLinkingHealthId(false);
    setHealthIdToLink('');
  };

  const handleUpdateRequest = (field: string) => {
    toast.info(`Update request for ${field} submitted. You will be contacted for verification.`);
  };

  if (showCreateWizard) {
    return (
      <HealthIdCreationWizard
        onComplete={() => setShowCreateWizard(false)}
        onCancel={() => setShowCreateWizard(false)}
      />
    );
  }

  if (!hasHealthId) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Get Your Health ID</CardTitle>
          <CardDescription>
            Create or link your Health ID to access all portal features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => setShowCreateWizard(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Health ID
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Dialog open={linkingHealthId} onOpenChange={setLinkingHealthId}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Link2 className="h-4 w-4 mr-2" />
                Link Existing Health ID
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link Existing Health ID</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="healthId">Health ID</Label>
                  <Input
                    id="healthId"
                    value={healthIdToLink}
                    onChange={(e) => setHealthIdToLink(e.target.value)}
                    placeholder="HID-0000000000-XXXX-0"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your Health ID from your card or previous registration
                  </p>
                </div>
                <Button onClick={handleLinkHealthId} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Verify and Link
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <p className="text-xs text-muted-foreground text-center">
            If you've previously registered at a health facility, you may already have a Health ID.
            Try linking it first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-id">My Health ID</TabsTrigger>
          <TabsTrigger value="dependents">
            <Users className="h-4 w-4 mr-1" />
            Dependents ({MOCK_DEPENDENTS.length})
          </TabsTrigger>
          <TabsTrigger value="requests">Update Requests</TabsTrigger>
        </TabsList>

        {/* My Health ID Tab */}
        <TabsContent value="my-id" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HealthIdCard {...MOCK_HEALTH_ID} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Information</CardTitle>
                <CardDescription>
                  Request updates to your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium">{MOCK_HEALTH_ID.givenNames} {MOCK_HEALTH_ID.familyName}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleUpdateRequest('name')}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{MOCK_HEALTH_ID.dateOfBirth}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleUpdateRequest('date of birth')}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{MOCK_HEALTH_ID.phone}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleUpdateRequest('phone number')}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Update requests require verification at a health facility
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dependents Tab */}
        <TabsContent value="dependents" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Family Members & Dependents</h3>
                <p className="text-sm text-muted-foreground">
                  Manage Health IDs for people under your care
                </p>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Dependent
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_DEPENDENTS.map((dependent) => (
                <Card key={dependent.healthId}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{dependent.givenNames} {dependent.familyName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{dependent.relationship}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-1">{dependent.healthId}</p>
                      </div>
                      {dependent.verificationStatus === 'verified' ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Update Requests Tab */}
        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Update Requests</CardTitle>
              <CardDescription>
                Track the status of your information update requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No pending update requests</p>
                <p className="text-sm">All your information is up to date</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
