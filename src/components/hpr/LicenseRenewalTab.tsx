/**
 * License Renewal & Payments Tab
 * Manage license renewals, payments, and state transitions
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  CreditCard, FileText, Clock, CheckCircle, XCircle, 
  AlertTriangle, RefreshCw, DollarSign, Calendar, Plus
} from 'lucide-react';

interface License {
  id: string;
  provider_id: string;
  registration_number: string;
  license_category: string;
  council_name: string;
  issue_date: string;
  expiry_date: string;
  status: string;
}

interface LicensePayment {
  id: string;
  license_id: string | null;
  provider_id: string;
  payment_type: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  payment_date: string;
  receipt_number: string | null;
  period_start: string | null;
  period_end: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface RenewalApplication {
  id: string;
  license_id: string | null;
  provider_id: string;
  application_number: string;
  application_date: string;
  current_expiry_date: string;
  requested_period_years: number;
  cpd_points_verified: boolean;
  documents_verified: boolean;
  status: string;
  decision_notes: string | null;
  new_expiry_date: string | null;
  created_at: string;
}

interface LicenseRenewalTabProps {
  providerId: string;
  isAdmin?: boolean;
}

export const LicenseRenewalTab = ({ providerId, isAdmin = false }: LicenseRenewalTabProps) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [payments, setPayments] = useState<LicensePayment[]>([]);
  const [renewals, setRenewals] = useState<RenewalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    licenseId: '',
    paymentType: 'renewal',
    amount: 0,
    currency: 'USD',
    paymentMethod: '',
    paymentReference: '',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    receiptNumber: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [providerId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadLicenses(),
      loadPayments(),
      loadRenewals(),
    ]);
    setLoading(false);
  };

  const loadLicenses = async () => {
    const { data, error } = await supabase
      .from('provider_licenses')
      .select('*')
      .eq('provider_id', providerId)
      .order('expiry_date', { ascending: false });

    if (!error && data) {
      setLicenses(data);
    }
  };

  const loadPayments = async () => {
    const { data, error } = await supabase
      .from('license_payments')
      .select('*')
      .eq('provider_id', providerId)
      .order('payment_date', { ascending: false });

    if (!error && data) {
      setPayments(data);
    }
  };

  const loadRenewals = async () => {
    const { data, error } = await supabase
      .from('license_renewal_applications')
      .select('*')
      .eq('provider_id', providerId)
      .order('application_date', { ascending: false });

    if (!error && data) {
      setRenewals(data);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || !paymentForm.paymentMethod) {
      toast.error('Please fill required fields');
      return;
    }

    const { error } = await supabase
      .from('license_payments')
      .insert({
        provider_id: providerId,
        license_id: paymentForm.licenseId || null,
        payment_type: paymentForm.paymentType,
        amount: paymentForm.amount,
        currency: paymentForm.currency,
        payment_method: paymentForm.paymentMethod,
        payment_reference: paymentForm.paymentReference || null,
        payment_date: paymentForm.paymentDate,
        receipt_number: paymentForm.receiptNumber || null,
        notes: paymentForm.notes || null,
        status: 'completed',
      });

    if (error) {
      toast.error('Failed to record payment');
    } else {
      toast.success('Payment recorded successfully');
      setPaymentDialogOpen(false);
      setPaymentForm({
        licenseId: '',
        paymentType: 'renewal',
        amount: 0,
        currency: 'USD',
        paymentMethod: '',
        paymentReference: '',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        receiptNumber: '',
        notes: '',
      });
      loadPayments();
    }
  };

  const handleStartRenewal = async (license: License) => {
    const { error } = await supabase
      .from('license_renewal_applications')
      .insert({
        provider_id: providerId,
        license_id: license.id,
        current_expiry_date: license.expiry_date,
        requested_period_years: 1,
        status: 'draft',
      });

    if (error) {
      toast.error('Failed to start renewal application');
    } else {
      toast.success('Renewal application created');
      loadRenewals();
    }
  };

  const handleSubmitRenewal = async (renewalId: string) => {
    const { error } = await supabase
      .from('license_renewal_applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', renewalId);

    if (error) {
      toast.error('Failed to submit application');
    } else {
      toast.success('Application submitted for review');
      loadRenewals();
    }
  };

  const handleApproveRenewal = async (renewal: RenewalApplication) => {
    const newExpiryDate = new Date(renewal.current_expiry_date);
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + renewal.requested_period_years);

    // Update renewal application
    const { error: renewalError } = await supabase
      .from('license_renewal_applications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        new_expiry_date: newExpiryDate.toISOString().split('T')[0],
        cpd_points_verified: true,
        documents_verified: true,
      })
      .eq('id', renewal.id);

    if (renewalError) {
      toast.error('Failed to approve renewal');
      return;
    }

    // Update license expiry
    if (renewal.license_id) {
      await supabase
        .from('provider_licenses')
        .update({
          expiry_date: newExpiryDate.toISOString().split('T')[0],
          status: 'active',
        })
        .eq('id', renewal.license_id);
    }

    toast.success('Renewal approved - license extended');
    loadRenewals();
    loadLicenses();
  };

  const handleRejectRenewal = async (renewalId: string, reason: string) => {
    const { error } = await supabase
      .from('license_renewal_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        decision_notes: reason,
      })
      .eq('id', renewalId);

    if (error) {
      toast.error('Failed to reject application');
    } else {
      toast.success('Application rejected');
      loadRenewals();
    }
  };

  const handleSuspendLicense = async (licenseId: string, reason: string) => {
    const { error } = await supabase
      .from('provider_licenses')
      .update({
        status: 'suspended',
      })
      .eq('id', licenseId);

    if (error) {
      toast.error('Failed to suspend license');
    } else {
      toast.success('License suspended');
      loadLicenses();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> {status}</Badge>;
      case 'expired':
      case 'rejected':
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> {status}</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> {status}</Badge>;
      case 'pending':
      case 'submitted':
      case 'under_review':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> {status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPayments = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Active Licenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {licenses.filter(l => l.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {licenses.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Pending Renewals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {renewals.filter(r => ['draft', 'submitted', 'under_review'].includes(r.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              applications in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalPayments.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Licenses Section */}
      <Card>
        <CardHeader>
          <CardTitle>Licenses</CardTitle>
          <CardDescription>Manage license status and renewals</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : licenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No licenses found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License</TableHead>
                  <TableHead>Council</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map(license => {
                  const isExpiring = new Date(license.expiry_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                  const isExpired = new Date(license.expiry_date) < new Date();
                  
                  return (
                    <TableRow key={license.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{license.registration_number}</div>
                          <div className="text-xs text-muted-foreground">{license.license_category}</div>
                        </div>
                      </TableCell>
                      <TableCell>{license.council_name}</TableCell>
                      <TableCell>{format(new Date(license.issue_date), 'PP')}</TableCell>
                      <TableCell>
                        <div className={isExpired ? 'text-destructive' : isExpiring ? 'text-yellow-600' : ''}>
                          {format(new Date(license.expiry_date), 'PP')}
                          {isExpiring && !isExpired && (
                            <div className="text-xs">Expires soon</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(license.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {license.status === 'active' && (isExpiring || isExpired) && (
                            <Button 
                              size="sm" 
                              onClick={() => handleStartRenewal(license)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Renew
                            </Button>
                          )}
                          {isAdmin && license.status === 'active' && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleSuspendLicense(license.id, 'Admin action')}
                            >
                              Suspend
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Renewal Applications */}
      {renewals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Renewal Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application #</TableHead>
                  <TableHead>Current Expiry</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>CPD Verified</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renewals.map(renewal => (
                  <TableRow key={renewal.id}>
                    <TableCell className="font-medium">{renewal.application_number}</TableCell>
                    <TableCell>{format(new Date(renewal.current_expiry_date), 'PP')}</TableCell>
                    <TableCell>{renewal.requested_period_years} year(s)</TableCell>
                    <TableCell>
                      {renewal.cpd_points_verified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(renewal.status)}</TableCell>
                    <TableCell className="text-right">
                      {renewal.status === 'draft' && (
                        <Button size="sm" onClick={() => handleSubmitRenewal(renewal.id)}>
                          Submit
                        </Button>
                      )}
                      {isAdmin && renewal.status === 'submitted' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveRenewal(renewal)}
                            className="bg-green-600"
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleRejectRenewal(renewal.id, 'Requirements not met')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>License fees and payment records</CardDescription>
            </div>
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>License (Optional)</Label>
                    <Select 
                      value={paymentForm.licenseId}
                      onValueChange={(v) => setPaymentForm(prev => ({ ...prev, licenseId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select license" />
                      </SelectTrigger>
                      <SelectContent>
                        {licenses.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.registration_number} - {l.license_category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Payment Type *</Label>
                    <Select 
                      value={paymentForm.paymentType}
                      onValueChange={(v) => setPaymentForm(prev => ({ ...prev, paymentType: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="initial">Initial Registration</SelectItem>
                        <SelectItem value="renewal">Annual Renewal</SelectItem>
                        <SelectItem value="restoration">Restoration Fee</SelectItem>
                        <SelectItem value="late_fee">Late Payment Fee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <Select 
                        value={paymentForm.currency}
                        onValueChange={(v) => setPaymentForm(prev => ({ ...prev, currency: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="ZWL">ZWL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Payment Method *</Label>
                    <Select 
                      value={paymentForm.paymentMethod}
                      onValueChange={(v) => setPaymentForm(prev => ({ ...prev, paymentMethod: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="card">Card Payment</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Reference Number</Label>
                      <Input
                        value={paymentForm.paymentReference}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Receipt Number</Label>
                      <Input
                        value={paymentForm.receiptNumber}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Payment Date</Label>
                    <Input
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  <Button onClick={handleRecordPayment} className="w-full">
                    Record Payment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments recorded
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.payment_date), 'PP')}</TableCell>
                    <TableCell className="capitalize">{payment.payment_type.replace('_', ' ')}</TableCell>
                    <TableCell className="font-medium">
                      {payment.currency} {Number(payment.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize">{payment.payment_method?.replace('_', ' ') || '-'}</TableCell>
                    <TableCell>{payment.payment_reference || payment.receipt_number || '-'}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
