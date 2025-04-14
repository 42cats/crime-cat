
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Server, Users, Settings } from 'lucide-react';
import { authService } from '@/api/authService';
import { useAuth } from '@/hooks/useAuth';

const Guilds: React.FC = () => {
  const { hasRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const { data: guilds, isLoading, error } = useQuery({
    queryKey: ['guilds'],
    queryFn: authService.getUserGuilds,
  });
  
  // Filter guilds based on search query
  const filteredGuilds = guilds?.filter(guild => 
    guild.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSettingsClick = (guildId: string) => {
    navigate(`/dashboard/guilds/${guildId}/message-format`);
  };
  
  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Discord Servers</h1>
            <p className="text-muted-foreground">
              Manage your Discord server integrations
            </p>
          </div>
          
          <div className="max-w-md mb-6">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-60 rounded-xl" />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }
  
  if (error) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Error Loading Servers</h1>
            <p className="text-muted-foreground">
              There was a problem loading your Discord servers. Please try again later.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Discord Servers</h1>
          <p className="text-muted-foreground">
            Manage your Discord server integrations
          </p>
        </div>
        
        <div className="max-w-md mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search servers..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {filteredGuilds && filteredGuilds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuilds.map((guild) => (
              <Card key={guild.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {guild.icon ? (
                      <img 
                        src={guild.icon} 
                        alt={guild.name} 
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Server className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-xl">{guild.name}</CardTitle>
                      <CardDescription>ID: {guild.id}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{guild.memberCount || 'Unknown'} members</span>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {guild.features?.map((feature, index) => (
                      <span 
                        key={index}
                        className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => handleSettingsClick(guild.id)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Message Settings
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Server className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-medium mb-2">No Servers Found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery 
                ? "No servers match your search criteria." 
                : "You don't have access to any Discord servers yet."}
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Guilds;
