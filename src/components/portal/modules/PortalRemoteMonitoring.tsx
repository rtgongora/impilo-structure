import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Heart, 
  Droplets, 
  Scale, 
  Thermometer,
  Bluetooth,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap
} from "lucide-react";

interface DeviceReading {
  id: string;
  deviceType: string;
  value: string;
  unit: string;
  timestamp: Date;
  status: "normal" | "warning" | "critical";
  trend?: "up" | "down" | "stable";
}

interface ConnectedDevice {
  id: string;
  name: string;
  type: string;
  icon: React.ReactNode;
  connected: boolean;
  lastSync: Date;
  battery: number;
}

interface CareProgram {
  id: string;
  name: string;
  description: string;
  progress: number;
  nextTask: string;
  nextTaskDue: Date;
  enrolled: boolean;
}

export const PortalRemoteMonitoring = () => {
  const [activeTab, setActiveTab] = useState("vitals");

  const recentReadings: DeviceReading[] = [
    {
      id: "1",
      deviceType: "Blood Pressure",
      value: "120/80",
      unit: "mmHg",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "normal",
      trend: "stable"
    },
    {
      id: "2",
      deviceType: "Blood Glucose",
      value: "95",
      unit: "mg/dL",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: "normal",
      trend: "down"
    },
    {
      id: "3",
      deviceType: "Weight",
      value: "72.5",
      unit: "kg",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "normal",
      trend: "stable"
    },
    {
      id: "4",
      deviceType: "Heart Rate",
      value: "78",
      unit: "bpm",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: "normal",
      trend: "up"
    },
    {
      id: "5",
      deviceType: "SpO2",
      value: "98",
      unit: "%",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: "normal"
    }
  ];

  const connectedDevices: ConnectedDevice[] = [
    {
      id: "1",
      name: "Omron BP Monitor",
      type: "blood_pressure",
      icon: <Heart className="h-5 w-5" />,
      connected: true,
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      battery: 85
    },
    {
      id: "2",
      name: "Accu-Chek Guide",
      type: "glucose",
      icon: <Droplets className="h-5 w-5" />,
      connected: true,
      lastSync: new Date(Date.now() - 4 * 60 * 60 * 1000),
      battery: 62
    },
    {
      id: "3",
      name: "Withings Scale",
      type: "weight",
      icon: <Scale className="h-5 w-5" />,
      connected: false,
      lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000),
      battery: 45
    }
  ];

  const carePrograms: CareProgram[] = [
    {
      id: "1",
      name: "Diabetes Management",
      description: "Daily glucose monitoring and lifestyle tracking",
      progress: 75,
      nextTask: "Log fasting glucose",
      nextTaskDue: new Date(Date.now() + 2 * 60 * 60 * 1000),
      enrolled: true
    },
    {
      id: "2",
      name: "Hypertension Control",
      description: "Blood pressure monitoring and medication adherence",
      progress: 82,
      nextTask: "Take evening BP reading",
      nextTaskDue: new Date(Date.now() + 6 * 60 * 60 * 1000),
      enrolled: true
    },
    {
      id: "3",
      name: "Maternal Health",
      description: "Prenatal care tracking and monitoring",
      progress: 0,
      nextTask: "Enroll to start",
      nextTaskDue: new Date(),
      enrolled: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "text-green-600 bg-green-100";
      case "warning": return "text-yellow-600 bg-yellow-100";
      case "critical": return "text-red-600 bg-red-100";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "Blood Pressure": return <Heart className="h-5 w-5 text-red-500" />;
      case "Blood Glucose": return <Droplets className="h-5 w-5 text-blue-500" />;
      case "Weight": return <Scale className="h-5 w-5 text-purple-500" />;
      case "Heart Rate": return <Activity className="h-5 w-5 text-pink-500" />;
      case "SpO2": return <Zap className="h-5 w-5 text-cyan-500" />;
      default: return <Thermometer className="h-5 w-5" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-4 text-center">
            <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700">120/80</p>
            <p className="text-xs text-red-600">Blood Pressure</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Droplets className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">95</p>
            <p className="text-xs text-blue-600">Glucose (mg/dL)</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Scale className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">72.5</p>
            <p className="text-xs text-purple-600">Weight (kg)</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-pink-700">78</p>
            <p className="text-xs text-pink-600">Heart Rate (bpm)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vitals">Vitals History</TabsTrigger>
          <TabsTrigger value="devices">My Devices</TabsTrigger>
          <TabsTrigger value="programs">Care Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Readings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReadings.map((reading) => (
                  <div 
                    key={reading.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-background">
                        {getDeviceIcon(reading.deviceType)}
                      </div>
                      <div>
                        <p className="font-medium">{reading.deviceType}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(reading.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold text-lg">{reading.value}</p>
                        <p className="text-xs text-muted-foreground">{reading.unit}</p>
                      </div>
                      {reading.trend && (
                        <div className={`p-1 rounded ${
                          reading.trend === "up" ? "text-red-500" :
                          reading.trend === "down" ? "text-green-500" :
                          "text-muted-foreground"
                        }`}>
                          {reading.trend === "up" ? <TrendingUp className="h-4 w-4" /> :
                           reading.trend === "down" ? <TrendingDown className="h-4 w-4" /> :
                           <Activity className="h-4 w-4" />}
                        </div>
                      )}
                      <Badge className={getStatusColor(reading.status)}>
                        {reading.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Log Manual Reading
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bluetooth className="h-5 w-5" />
                  Connected Devices
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {connectedDevices.map((device) => (
                  <div 
                    key={device.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${device.connected ? "bg-green-100" : "bg-muted"}`}>
                        {device.icon}
                      </div>
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last synced: {formatTimeAgo(device.lastSync)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <div className="w-8 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${device.battery > 50 ? "bg-green-500" : device.battery > 20 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${device.battery}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{device.battery}%</span>
                        </div>
                      </div>
                      <Badge variant={device.connected ? "default" : "secondary"}>
                        {device.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Compatible Devices</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect Bluetooth-enabled medical devices for automatic data sync
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Blood Pressure Monitors</Badge>
                <Badge variant="outline">Glucose Meters</Badge>
                <Badge variant="outline">Pulse Oximeters</Badge>
                <Badge variant="outline">Smart Scales</Badge>
                <Badge variant="outline">Thermometers</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          {carePrograms.map((program) => (
            <Card key={program.id} className={!program.enrolled ? "opacity-75" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {program.enrolled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Target className="h-4 w-4 text-muted-foreground" />
                      )}
                      {program.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{program.description}</p>
                  </div>
                  {!program.enrolled && (
                    <Button size="sm">Enroll</Button>
                  )}
                </div>
                
                {program.enrolled && (
                  <>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span>Program Progress</span>
                        <span className="font-medium">{program.progress}%</span>
                      </div>
                      <Progress value={program.progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Next Task</p>
                          <p className="text-xs text-muted-foreground">{program.nextTask}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Complete
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Alert Thresholds */}
      <Card className="border-yellow-200 bg-yellow-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Alert Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Get notified when readings fall outside your safe ranges. Abnormal vitals can trigger telehealth escalation.
          </p>
          <Button variant="outline" className="w-full">
            Configure Alert Thresholds
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
