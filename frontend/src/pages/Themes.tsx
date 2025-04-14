import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageTransition from '@/components/PageTransition';
import ThemeCard from '@/components/ThemeCard';
import { Input } from '@/components/ui/input';
import { Search, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { themesService } from '@/api/themesService';
import { Skeleton } from '@/components/ui/skeleton';

const Themes: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: themes, isLoading, error } = useQuery({
    queryKey: ['themes'],
    queryFn: themesService.getThemes,
  });

  const allTags = Array.from(
    new Set((themes || []).flatMap(theme => theme.tags || []))
  ).sort();

  const filteredThemes = (themes || []).filter(theme => {
    const matchesSearch = 
      theme.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      theme.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag ? theme.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">게임 테마</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              흥미로운 크라임씬 시나리오와 테마를 찾아보세요. 각 테마는 상세한 설명과 함께 제공됩니다.
            </p>
          </div>
          <div className="max-w-4xl mx-auto mb-6">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="max-w-4xl mx-auto mb-10">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="container mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-4">테마 불러오기 오류</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              테마를 불러오는 중 문제가 발생했습니다. 나중에 다시 시도해주세요.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">게임 테마</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            다양한 크라임씬 테마를 탐색하고, 자세한 설명과 함께 테마를 살펴보세요.
          </p>
        </div>
        <div className="max-w-4xl mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="테마 제목 또는 설명 검색..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {allTags.length > 0 && (
          <div className="max-w-4xl mx-auto mb-10">
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge 
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => handleTagClick(tag)}
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="max-w-6xl mx-auto">
          {filteredThemes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredThemes.map((theme, index) => (
                <ThemeCard key={theme.id} theme={theme} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">검색 조건에 맞는 테마가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Themes;
