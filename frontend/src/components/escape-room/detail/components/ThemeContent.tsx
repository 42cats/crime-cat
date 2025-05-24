import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { EscapeRoomThemeDetailType } from '@/lib/types';

interface ThemeContentProps {
    theme: EscapeRoomThemeDetailType;
}

const ThemeContent: React.FC<ThemeContentProps> = ({ theme }) => {
    // 줄바꿈을 <br>로 변환하는 함수
    const formatContent = (content: string) => {
        return content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < content.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    상세 설명
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {theme.content ? formatContent(theme.content) : '상세 설명이 없습니다.'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default ThemeContent;
