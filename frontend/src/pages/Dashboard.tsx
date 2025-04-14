
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { CommandIcon, Gamepad2, Users, Activity, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Mock statistics - would be fetched from Supabase in production
  const stats = [
    {
      title: 'Commands',
      value: '35',
      description: 'Total bot commands',
      icon: <CommandIcon className="h-6 w-6 text-primary" />,
      link: '/dashboard/commands'
    },
    {
      title: 'Game Themes',
      value: '12',
      description: 'Published themes',
      icon: <Gamepad2 className="h-6 w-6 text-primary" />,
      link: '/dashboard/themes'
    },
    {
      title: 'Users',
      value: '147',
      description: 'Registered users',
      icon: <Users className="h-6 w-6 text-primary" />,
      link: '/dashboard/users'
    },
    {
      title: 'Activity',
      value: '3.8K',
      description: 'Command executions',
      icon: <Activity className="h-6 w-6 text-primary" />,
      link: '#'
    },
  ];

  // Recent activities mock data
  const activities = [
    {
      id: 1,
      action: 'Added new command',
      detail: 'poll',
      timestamp: '2 hours ago',
      user: 'Admin'
    },
    {
      id: 2,
      action: 'Updated theme',
      detail: 'Cyberpunk 2077',
      timestamp: '5 hours ago',
      user: 'Admin'
    },
    {
      id: 3,
      action: 'Changed permission',
      detail: 'Moderator role',
      timestamp: '1 day ago',
      user: 'Admin'
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.displayName}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Link to={stat.link} key={index} className="block">
            <Card className="card-hover">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                {stat.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Overview and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bot Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Bot Status</CardTitle>
            <CardDescription>Current status and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="glass w-16 h-16 rounded-full flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Online
                </p>
                <p className="text-sm text-muted-foreground">Ping: 42ms</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">Uptime</p>
                <p className="font-medium">99.9%</p>
              </div>
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">Servers</p>
                <p className="font-medium">128</p>
              </div>
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">Active Users</p>
                <p className="font-medium">2,548</p>
              </div>
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">Memory Usage</p>
                <p className="font-medium">512MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest actions taken by administrators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>{' '}
                      <span className="text-muted-foreground">{activity.action}</span>{' '}
                      <span className="font-medium">{activity.detail}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
