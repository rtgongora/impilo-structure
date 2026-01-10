/**
 * Service Discovery & Booking Component
 * Find nearby facilities and book appointments
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  MapPin, 
  Clock, 
  Star, 
  Phone, 
  Calendar,
  Building2,
  Stethoscope,
  Activity,
  Pill,
  Video,
  ChevronRight,
  Filter,
  Navigation,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface Facility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'health_center';
  distance: string;
  address: string;
  phone: string;
  rating: number;
  services: string[];
  openNow: boolean;
  waitTime?: string;
}

interface ServiceType {
  id: string;
  name: string;
  icon: typeof Stethoscope;
  description: string;
  requiresApproval?: boolean;
}

const SERVICE_TYPES: ServiceType[] = [
  { id: 'opd', name: 'OPD Visit', icon: Stethoscope, description: 'General outpatient consultation' },
  { id: 'anc', name: 'ANC Clinic', icon: Activity, description: 'Antenatal care visit' },
  { id: 'art', name: 'ART Clinic', icon: Pill, description: 'HIV treatment and care' },
  { id: 'ncd', name: 'NCD Clinic', icon: Activity, description: 'Chronic disease management' },
  { id: 'immunization', name: 'Immunization', icon: Activity, description: 'Vaccines and immunizations' },
  { id: 'lab', name: 'Laboratory', icon: Activity, description: 'Blood tests and diagnostics' },
  { id: 'imaging', name: 'Imaging', icon: Activity, description: 'X-ray, ultrasound, CT scans', requiresApproval: true },
  { id: 'dialysis', name: 'Dialysis', icon: Activity, description: 'Kidney dialysis session', requiresApproval: true },
  { id: 'telecare', name: 'Telecare', icon: Video, description: 'Virtual consultation' },
];

const MOCK_FACILITIES: Facility[] = [
  {
    id: '1',
    name: 'Parirenyatwa Group of Hospitals',
    type: 'hospital',
    distance: '2.3 km',
    address: 'Mazowe St, Harare',
    phone: '+263 24 2701 633',
    rating: 4.2,
    services: ['opd', 'anc', 'art', 'lab', 'imaging', 'dialysis'],
    openNow: true,
    waitTime: '45 min',
  },
  {
    id: '2',
    name: 'Borrowdale Clinic',
    type: 'clinic',
    distance: '4.1 km',
    address: 'Borrowdale Road, Harare',
    phone: '+263 24 2850 123',
    rating: 4.5,
    services: ['opd', 'anc', 'ncd', 'lab'],
    openNow: true,
    waitTime: '20 min',
  },
  {
    id: '3',
    name: 'Mabvuku Polyclinic',
    type: 'health_center',
    distance: '6.8 km',
    address: 'Mabvuku, Harare',
    phone: '+263 24 2480 567',
    rating: 3.8,
    services: ['opd', 'anc', 'immunization', 'art'],
    openNow: true,
    waitTime: '35 min',
  },
  {
    id: '4',
    name: 'Avenues Clinic',
    type: 'clinic',
    distance: '1.5 km',
    address: 'Baines Ave, Harare',
    phone: '+263 24 2251 900',
    rating: 4.7,
    services: ['opd', 'lab', 'imaging', 'ncd'],
    openNow: false,
  },
];

const AVAILABLE_SLOTS = [
  { date: addDays(new Date(), 1), slots: ['08:00', '09:00', '10:30', '14:00', '15:30'] },
  { date: addDays(new Date(), 2), slots: ['08:30', '11:00', '14:30', '16:00'] },
  { date: addDays(new Date(), 3), slots: ['09:00', '10:00', '11:30', '13:00', '15:00'] },
  { date: addDays(new Date(), 5), slots: ['08:00', '09:30', '11:00', '14:00'] },
];

export function ServiceDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingStep, setBookingStep] = useState<'service' | 'time' | 'reason' | 'confirm'>('service');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredFacilities = MOCK_FACILITIES.filter(f => {
    const matchesSearch = !searchQuery || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesService = !selectedService || f.services.includes(selectedService);
    return matchesSearch && matchesService;
  });

  const getFacilityTypeBadge = (type: Facility['type']) => {
    switch (type) {
      case 'hospital':
        return <Badge variant="secondary">Hospital</Badge>;
      case 'clinic':
        return <Badge variant="outline">Clinic</Badge>;
      case 'health_center':
        return <Badge variant="outline">Health Center</Badge>;
    }
  };

  const handleStartBooking = (facility: Facility) => {
    setSelectedFacility(facility);
    setShowBookingDialog(true);
    setBookingStep('service');
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setShowBookingDialog(false);
    toast.success('Appointment booked successfully!', {
      description: `${selectedFacility?.name} on ${selectedDate ? format(selectedDate, 'EEE, dd MMM') : ''} at ${selectedTime}`,
    });
    // Reset state
    setSelectedFacility(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setReason('');
    setBookingStep('service');
  };

  const selectedServiceInfo = SERVICE_TYPES.find(s => s.id === selectedService);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search facilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Navigation className="h-4 w-4 mr-2" />
              Use My Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Service Type Selection */}
      <div>
        <h3 className="font-medium mb-3">What service do you need?</h3>
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            <Button
              variant={selectedService === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedService(null)}
            >
              All Services
            </Button>
            {SERVICE_TYPES.map((service) => (
              <Button
                key={service.id}
                variant={selectedService === service.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedService(service.id)}
                className="whitespace-nowrap"
              >
                <service.icon className="h-4 w-4 mr-1" />
                {service.name}
                {service.requiresApproval && (
                  <AlertCircle className="h-3 w-3 ml-1 text-warning" />
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
        {selectedServiceInfo?.requiresApproval && (
          <p className="text-xs text-warning mt-2">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            This service requires prior approval. Your request will be reviewed.
          </p>
        )}
      </div>

      {/* Facilities List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Nearby Facilities ({filteredFacilities.length})</h3>
          <Button variant="ghost" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>

        {filteredFacilities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No facilities found matching your criteria</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredFacilities.map((facility) => (
              <Card key={facility.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{facility.name}</h4>
                        {getFacilityTypeBadge(facility.type)}
                        {facility.openNow ? (
                          <Badge className="bg-success/10 text-success border-success/20">Open</Badge>
                        ) : (
                          <Badge variant="secondary">Closed</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {facility.distance}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-warning" />
                          {facility.rating}
                        </span>
                        {facility.waitTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            ~{facility.waitTime} wait
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">{facility.address}</p>

                      <div className="flex flex-wrap gap-1">
                        {facility.services.slice(0, 4).map((serviceId) => {
                          const service = SERVICE_TYPES.find(s => s.id === serviceId);
                          return service ? (
                            <Badge key={serviceId} variant="outline" className="text-xs">
                              {service.name}
                            </Badge>
                          ) : null;
                        })}
                        {facility.services.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{facility.services.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => handleStartBooking(facility)}>
                        Book
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>

          {selectedFacility && (
            <div className="space-y-4">
              {/* Facility Info */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedFacility.name}</p>
                <p className="text-sm text-muted-foreground">{selectedFacility.address}</p>
              </div>

              {/* Step: Select Service */}
              {bookingStep === 'service' && (
                <div className="space-y-3">
                  <Label>Select Service</Label>
                  <RadioGroup
                    value={selectedService || ''}
                    onValueChange={(value) => setSelectedService(value)}
                  >
                    {SERVICE_TYPES.filter(s => selectedFacility.services.includes(s.id)).map((service) => (
                      <div key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={service.id} id={service.id} />
                        <Label htmlFor={service.id} className="flex-1 cursor-pointer">
                          <span className="font-medium">{service.name}</span>
                          <p className="text-xs text-muted-foreground">{service.description}</p>
                        </Label>
                        {service.requiresApproval && (
                          <Badge variant="outline" className="text-xs">Approval needed</Badge>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                  <Button 
                    className="w-full" 
                    onClick={() => setBookingStep('time')}
                    disabled={!selectedService}
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Step: Select Date/Time */}
              {bookingStep === 'time' && (
                <div className="space-y-3">
                  <Label>Select Date & Time</Label>
                  <div className="space-y-3">
                    {AVAILABLE_SLOTS.map((day, i) => (
                      <div key={i} className="border rounded-lg p-3">
                        <p className="font-medium mb-2">{format(day.date, 'EEEE, dd MMMM')}</p>
                        <div className="flex flex-wrap gap-2">
                          {day.slots.map((slot) => (
                            <Button
                              key={slot}
                              variant={selectedDate === day.date && selectedTime === slot ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedDate(day.date);
                                setSelectedTime(slot);
                              }}
                            >
                              {slot}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBookingStep('service')}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={() => setBookingStep('reason')}
                      disabled={!selectedDate || !selectedTime}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Reason */}
              {bookingStep === 'reason' && (
                <div className="space-y-3">
                  <div>
                    <Label>Reason for Visit</Label>
                    <Textarea
                      placeholder="Briefly describe why you need this appointment..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This helps the provider prepare for your visit
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBookingStep('time')}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={() => setBookingStep('confirm')}>
                      Review Booking
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Confirm */}
              {bookingStep === 'confirm' && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {selectedDate ? format(selectedDate, 'EEEE, dd MMMM yyyy') : ''} at {selectedTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedServiceInfo?.name}</span>
                    </div>
                    {reason && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Reason:</p>
                        <p className="text-sm">{reason}</p>
                      </div>
                    )}
                  </div>

                  {selectedServiceInfo?.requiresApproval && (
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm">
                        <AlertCircle className="h-4 w-4 inline mr-1 text-warning" />
                        This booking requires approval. You will be notified once approved.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBookingStep('reason')}>
                      Back
                    </Button>
                    <Button className="flex-1" onClick={handleConfirmBooking} disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Confirm Booking
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
