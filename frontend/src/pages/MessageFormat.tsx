import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import PageTransition from '@/components/PageTransition';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Eye, MessageSquare, Loader } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/components/ui/use-toast';
import { messageFormatsService } from '@/api';
import { apiClient } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface MessageFormatFormValues {
  formatType: 'welcome' | 'goodbye' | 'announcement' | 'custom';
  content: string;
  isEnabled: boolean;
}

const MessageFormat: React.FC = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: messageFormats, isLoading, error } = useQuery({
    queryKey: ['messageFormats', guildId],
    queryFn: () => guildId ? messageFormatsService.getMessageFormats(guildId) : Promise.reject('No guild ID'),
    enabled: !!guildId,
  });
  
  const initialData: MessageFormatFormValues = messageFormats?.[0] ? {
    formatType: messageFormats[0].formatType,
    content: messageFormats[0].content,
    isEnabled: messageFormats[0].isEnabled
  } : {
    formatType: 'welcome',
    content: '# Welcome to our server, {user}!\n\nWe\'re glad to have you here. Please check out our <#123456789> channel for the rules.\n\n## Useful commands\n- `/help` - List available commands\n- `/role` - Assign yourself a role\n\nEnjoy your stay!',
    isEnabled: true
  };
  
  const form = useForm<MessageFormatFormValues>({
    defaultValues: initialData
  });
  
  const saveMessageFormat = useMutation({
    mutationFn: async (values: MessageFormatFormValues) => {
      if (!guildId) throw new Error("No guild ID provided");
      
      if (messageFormats?.[0]) {
        // Update existing message format
        const response = await apiClient.put<any>(`/guilds/${guildId}/message-formats/${messageFormats[0].id}`, {
          formatType: values.formatType,
          content: values.content,
          isEnabled: values.isEnabled,
        });
        
        return 'updated';
      } 
      
      // Create new message format
      const response = await apiClient.post<any>(`/guilds/${guildId}/message-formats`, {
        formatType: values.formatType,
        content: values.content,
        isEnabled: values.isEnabled,
      });
      
      return 'created';
    },
    onSuccess: (result) => {
      toast({
        title: `Message format ${result}`,
        description: `The message format was successfully ${result}.`,
      });
    },
    onError: (error) => {
      console.error('Error saving message format:', error);
      toast({
        title: 'Error saving message format',
        description: 'There was a problem saving the message format. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: MessageFormatFormValues) => {
    saveMessageFormat.mutate(data);
  };
  
  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-8">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate('/dashboard/guilds')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Servers
          </Button>
          
          <div className="mb-8">
            <Skeleton className="h-10 w-1/2 mb-2" />
            <Skeleton className="h-6 w-3/4" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="md:col-span-3">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  if (error) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-8">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => navigate('/dashboard/guilds')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Servers
          </Button>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Error Loading Message Format</h1>
            <p className="text-muted-foreground">
              There was a problem loading the message format. Please try again later.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-6 py-8">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate('/dashboard/guilds')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Servers
        </Button>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Message Format Editor</h1>
          <p className="text-muted-foreground">
            Customize how messages appear in your Discord server.
            Server ID: {guildId}
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-6">
                <FormField
                  control={form.control}
                  name="formatType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select message type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="goodbye">Goodbye</SelectItem>
                          <SelectItem value="announcement">Announcement</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the type of message you want to customize
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <div className="pt-6">
                  <Label className="mb-2 block">Help</Label>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>You can use Markdown to format your messages.</p>
                    <p>Available variables:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><code>{'{user}'}</code> - Username</li>
                      <li><code>{'{server}'}</code> - Server name</li>
                      <li><code>{'{count}'}</code> - Member count</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-3">
                <Tabs defaultValue="editor">
                  <div className="flex justify-between items-center mb-4">
                    <TabsList>
                      <TabsTrigger value="editor">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Editor
                      </TabsTrigger>
                      <TabsTrigger value="preview">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="editor" className="mt-0">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your message format using Markdown..."
                              className="font-mono min-h-[300px] resize-y"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  
                  <TabsContent value="preview" className="mt-0">
                    <div className="border rounded-md p-6 min-h-[300px] bg-background">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>
                          {form.watch('content')
                            .replace('{user}', 'ExampleUser')
                            .replace('{server}', 'Example Server')
                            .replace('{count}', '145')
                          }
                        </ReactMarkdown>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={saveMessageFormat.isPending}
              >
                {saveMessageFormat.isPending ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Message Format
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PageTransition>
  );
};

export default MessageFormat;
