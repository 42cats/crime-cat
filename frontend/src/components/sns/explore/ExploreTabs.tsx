import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExploreTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isVisible: boolean;
}

const ExploreTabs: React.FC<ExploreTabsProps> = ({
  activeTab,
  onTabChange,
  isVisible
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Tabs
      defaultValue="popular"
      value={activeTab}
      onValueChange={onTabChange}
      className="mb-6"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="popular">인기</TabsTrigger>
        <TabsTrigger value="random">둘러보기</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ExploreTabs;