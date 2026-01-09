/**
 * Facility Reference Data Management
 * Manage facility types, ownership types, service categories, admin hierarchies
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Plus, 
  Search,
  Building2,
  Users,
  Stethoscope,
  MapPin,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  useFacilityTypes, 
  useFacilityOwnershipTypes, 
  useFacilityServiceCategories,
  useFacilityAdminHierarchies 
} from '@/hooks/useFacilityData';
import { LEVEL_OF_CARE_LABELS } from '@/types/facility';

export const FacilityReferenceData = () => {
  const [activeTab, setActiveTab] = useState('types');
  const [searchQuery, setSearchQuery] = useState('');

  const { types: facilityTypes, loading: typesLoading } = useFacilityTypes();
  const { types: ownershipTypes, loading: ownershipLoading } = useFacilityOwnershipTypes();
  const { categories: serviceCategories, loading: servicesLoading } = useFacilityServiceCategories();
  const { hierarchies, loading: hierarchiesLoading } = useFacilityAdminHierarchies();

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="types" className="gap-2">
            <Building2 className="h-4 w-4" />
            Facility Types
          </TabsTrigger>
          <TabsTrigger value="ownership" className="gap-2">
            <Users className="h-4 w-4" />
            Ownership Types
          </TabsTrigger>
          <TabsTrigger value="services" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Service Categories
          </TabsTrigger>
          <TabsTrigger value="hierarchy" className="gap-2">
            <MapPin className="h-4 w-4" />
            Admin Hierarchy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Facility Types</CardTitle>
                <CardDescription>Define the types of health facilities in the registry</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Level of Care</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilityTypes
                    .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(type => (
                      <TableRow key={type.id}>
                        <TableCell className="font-mono text-sm">{type.code}</TableCell>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{type.category || 'Other'}</Badge>
                        </TableCell>
                        <TableCell>
                          {type.level_of_care && (
                            <Badge variant="secondary">
                              {LEVEL_OF_CARE_LABELS[type.level_of_care] || type.level_of_care}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={type.is_active ? 'default' : 'secondary'}>
                            {type.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ownership" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Ownership Types</CardTitle>
                <CardDescription>Define facility ownership and managing authority types</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ownershipTypes.map(type => (
                    <TableRow key={type.id}>
                      <TableCell className="font-mono text-sm">{type.code}</TableCell>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{type.sector || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={type.is_active ? 'default' : 'secondary'}>
                          {type.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Service Categories</CardTitle>
                <CardDescription>Define the types of services facilities can offer</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {serviceCategories.map(cat => (
                  <div key={cat.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-2">{cat.code}</p>
                      </div>
                      <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Administrative Hierarchy</CardTitle>
                <CardDescription>Geographic administrative levels (Country → Province → District → Ward)</CardDescription>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Level
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Level Name</TableHead>
                    <TableHead>Population</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hierarchies.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-mono text-sm">{h.code}</TableCell>
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{h.level}</Badge>
                      </TableCell>
                      <TableCell>{h.level_name}</TableCell>
                      <TableCell>{h.population?.toLocaleString() || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={h.is_active ? 'default' : 'secondary'}>
                          {h.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
