import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';
import { EscapeRoomThemeDetailType } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

interface ThemeGenreTagsProps {
    theme: EscapeRoomThemeDetailType;
}

const ThemeGenreTags: React.FC<ThemeGenreTagsProps> = ({ theme }) => {
    const navigate = useNavigate();

    const handleTagClick = (tag: string) => {
        // 장르 태그로 검색 페이지로 이동
        navigate(`/themes/escape-room?genre=${encodeURIComponent(tag)}`);
    };

    if (!theme.genreTags || theme.genreTags.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Tag className="w-5 h-5" />
                    장르 태그
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {theme.genreTags.map((tag, index) => (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleTagClick(tag)}
                        >
                            #{tag}
                        </Badge>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                    태그를 클릭하면 같은 장르의 다른 테마를 검색할 수 있습니다.
                </p>
            </CardContent>
        </Card>
    );
};

export default ThemeGenreTags;
