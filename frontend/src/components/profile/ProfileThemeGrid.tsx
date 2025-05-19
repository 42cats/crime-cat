import React, { useState, useEffect } from 'react';
import { getUserThemes, CrimesceneThemeSummeryDto } from '@/api/profile/themes';
import { Badge } from '@/components/ui/badge';
import { PackageIcon } from 'lucide-react';
import ThemeDetailModal from './ThemeDetailModal';

interface ProfileThemeGridProps {
  userId: string;
}

const ProfileThemeGrid: React.FC<ProfileThemeGridProps> = ({ userId }) => {
  const [themes, setThemes] = useState<CrimesceneThemeSummeryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<CrimesceneThemeSummeryDto | null>(null);

  useEffect(() => {
    setLoading(true);
    getUserThemes(userId)
      .then((data) => {
        console.log("테마 데이터:", data);
        setThemes(data.themeList || []);
      })
      .catch((err) => {
        console.error("테마 목록 로드 실패:", err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  if (!themes.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-md">
        <PackageIcon size={48} className="mb-4" />
        <p className="text-sm">제작한 테마가 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {themes.map((theme) => (
          <div
            key={theme.themeId}
            className="relative aspect-square bg-gray-100 overflow-hidden group cursor-pointer rounded-md shadow-sm hover:shadow-md transition-shadow"
            onClick={() => setSelectedTheme(theme)}
          >
            <img
              src={theme.thumbNail || "/content/image/default_image2.png"}
              alt={theme.themeTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-50 transition-opacity flex items-center justify-center">
              <div className="text-white flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                <span className="text-xs font-semibold text-center line-clamp-2">
                  {theme.themeTitle}
                </span>
                <div className="mt-2 flex items-center text-xs">
                  <Badge variant="outline" className="bg-white/20 text-white border-white/50">
                    {theme.themePrice?.toLocaleString()}원
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 테마 상세 모달 */}
      {selectedTheme && (
        <ThemeDetailModal 
          theme={selectedTheme} 
          isOpen={!!selectedTheme} 
          onClose={() => setSelectedTheme(null)} 
          userId={userId}
        />
      )}
    </>
  );
};

export default ProfileThemeGrid;
