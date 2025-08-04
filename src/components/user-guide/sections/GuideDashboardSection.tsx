import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Clock, Package, DollarSign, AlertCircle } from 'lucide-react';

interface GuideSectionProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export function GuideDashboardSection({ onComplete, isCompleted }: GuideSectionProps) {
  const financialMetrics = [
    {
      title: 'Incoming (this month)',
      description: 'Current month revenue pipeline',
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      title: 'Shipped (this month)',
      description: 'Completed deliveries and revenue recognition',
      icon: Package,
      color: 'text-blue-500'
    },
    {
      title: 'Book to Bill',
      description: 'Order intake vs. shipment ratio',
      icon: BarChart3,
      color: 'text-purple-500'
    },
    {
      title: 'OTD (On Time Delivery)',
      description: 'Delivery performance percentage',
      icon: Clock,
      color: 'text-orange-500'
    }
  ];

  const operationalMetrics = [
    {
      title: 'Days in House',
      description: 'Average order processing time'
    },
    {
      title: 'Total Orders',
      description: 'Current active order count'
    },
    {
      title: 'Confirmed Backlog',
      description: 'Secured future revenue'
    },
    {
      title: 'Average Order Value',
      description: 'Revenue per transaction'
    },
    {
      title: 'Orders on Hold',
      description: 'Items requiring attention'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-4">Operations Dashboard</h2>
        <p className="text-lg text-muted-foreground mb-6">
          Real-time operational insights and performance metrics for data-driven decisions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Accessing the Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">1. Click <strong>Dashboard</strong> in left navigation</p>
          <p className="text-sm">2. Select <strong>Operations Dashboard</strong> for detailed metrics</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Financial Metrics</CardTitle>
          <CardDescription>Critical performance indicators for financial health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {financialMetrics.map((metric) => (
              <div key={metric.title} className="flex items-start gap-3 p-3 rounded-lg border">
                <metric.icon className={`h-5 w-5 mt-1 ${metric.color}`} />
                <div>
                  <h4 className="font-medium mb-1">{metric.title}</h4>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational Metrics</CardTitle>
          <CardDescription>Key indicators for operational efficiency and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {operationalMetrics.map((metric) => (
              <div key={metric.title} className="p-3 rounded-lg border">
                <h4 className="font-medium mb-1">{metric.title}</h4>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Order Status by Amount</h4>
              <p className="text-sm text-muted-foreground mb-2">Visual breakdown of order pipeline by status:</p>
              <div className="flex gap-2 mb-1">
                <Badge variant="default" className="bg-green-100 text-green-800">Green: Ready orders</Badge>
                <Badge variant="destructive">Red: Credit hold orders</Badge>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Yellow: On hold orders</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Monthly Order Amounts</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 12-month trend analysis</li>
                <li>• Seasonal pattern identification</li>
                <li>• Growth tracking</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Site Amounts</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Geographic revenue distribution</li>
                <li>• Regional performance comparison</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Using Dashboard Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-1">Daily Monitoring</h4>
              <p className="text-sm text-muted-foreground">Check OTD and orders on hold for immediate attention items</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Weekly Reviews</h4>
              <p className="text-sm text-muted-foreground">Analyze monthly trends and backlog for operational planning</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Monthly Planning</h4>
              <p className="text-sm text-muted-foreground">Use site data for resource allocation and territory focus</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Quarterly Strategy</h4>
              <p className="text-sm text-muted-foreground">Leverage trend data for forecasting and strategic planning</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Data Management & Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-1">Current Automation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automated report generation in progress</li>
                <li>• Scheduled data uploads for real-time accuracy</li>
                <li>• Elimination of manual dashboard updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Data Import/Export</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Import Data: Blue button in top right of Operations Dashboard</li>
                <li>• Export PDF: Available in dashboard view</li>
                <li>• Clear Data: Reset function for data refresh</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={onComplete} 
          variant={isCompleted ? "secondary" : "default"}
          disabled={isCompleted}
        >
          {isCompleted ? "Section Completed" : "Mark as Complete"}
        </Button>
      </div>
    </div>
  );
}