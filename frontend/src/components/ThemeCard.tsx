import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { User, Users, Tag, Coins } from 'lucide-react';
import { Theme } from '@/lib/types';

interface ThemeCardProps {
  theme: Theme;
  index: number;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme }) => {
  return (
    <Link to={`/themes/${theme.id}`}>
      <Card className="hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden">
        <img
          src={theme.thumbnail}
          alt={theme.title}
          className="w-full h-48 object-cover"
        />
        <CardContent className="p-4 space-y-2">
          <h2 className="text-xl font-bold">{theme.title}</h2>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {theme.description}
          </p>

          <div className="flex flex-wrap gap-2 text-sm mt-2">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Tag className="w-4 h-4" />
              {theme.tags.join(', ')}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <User className="w-4 h-4" />
              {theme.makers.join(', ')}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              {theme.players}인
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Coins className="w-4 h-4" />
              ₩{theme.price.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ThemeCard;
