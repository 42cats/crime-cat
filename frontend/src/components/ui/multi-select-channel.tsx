import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

type ChannelSelectProps = {
  availableChannels: { id: string; name: string }[];
  selectedChannels: string[];
  onChannelChange: (channels: string[]) => void;
};

export const ChannelMultiSelect: React.FC<ChannelSelectProps> = ({
  availableChannels,
  selectedChannels: initialSelectedChannels,
  onChannelChange
}) => {
  const [selectedChannels, setSelectedChannels] = useState<string[]>(initialSelectedChannels);

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleConfirm = () => {
    onChannelChange(selectedChannels);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {availableChannels.map((channel) => (
          <div 
            key={channel.id} 
            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded"
          >
            <Checkbox
              checked={selectedChannels.includes(channel.id)}
              onCheckedChange={() => toggleChannel(channel.id)}
              id={`channel-${channel.id}`}
            />
            <label 
              htmlFor={`channel-${channel.id}`} 
              className="text-sm font-medium"
            >
              {channel.name}
            </label>
          </div>
        ))}
      </div>
      <div className="flex justify-end space-x-2 mt-4">
        <Button 
          variant="outline"
          onClick={handleConfirm}
        >
          확인
        </Button>
      </div>
    </div>
  );
};
