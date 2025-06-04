import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { EscapeRoomThemeDetailType } from '@/lib/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface ThemeContentProps {
    theme: EscapeRoomThemeDetailType;
}

const ThemeContent: React.FC<ThemeContentProps> = ({ theme }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    상세 설명
                </CardTitle>
            </CardHeader>
            <CardContent>
                {theme.content ? (
                    <MarkdownRenderer 
                        content={theme.content}
                        className="prose prose-sm max-w-none dark:prose-invert"
                    />
                ) : (
                    <p className="text-sm text-muted-foreground">상세 설명이 없습니다.</p>
                )}
            </CardContent>
        </Card>
    );
};

export default ThemeContent;
