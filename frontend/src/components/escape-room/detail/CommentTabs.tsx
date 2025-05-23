import React, { useState } from 'react';
import { MessageCircle, Lock, Shield, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GeneralComments from './GeneralComments';
import SpoilerComments from './SpoilerComments';

interface CommentTabsProps {
    themeId: string;
    hasGameHistory: boolean;
    allowComments: boolean;
}

const CommentTabs: React.FC<CommentTabsProps> = ({
    themeId,
    hasGameHistory,
    allowComments
}) => {
    const [activeCommentTab, setActiveCommentTab] = useState<'general' | 'spoiler'>('general');

    if (!allowComments) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <Lock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                        댓글이 비활성화되었습니다
                    </h3>
                    <p className="text-sm text-gray-500">
                        이 테마는 댓글 기능이 비활성화되어 있습니다.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* 스포일러 보호 안내 */}
            <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                    <strong>스포일러 보호 시스템:</strong> 스포일러가 포함된 댓글은 해당 테마를 플레이한 사용자만 볼 수 있습니다.
                    {!hasGameHistory && (
                        <span className="text-orange-600 font-medium">
                            {" "}이 테마를 플레이한 후 스포일러 댓글을 확인하세요.
                        </span>
                    )}
                </AlertDescription>
            </Alert>

            <Tabs value={activeCommentTab} onValueChange={(value) => setActiveCommentTab(value as any)}>
                <TabsList className="w-full">
                    <TabsTrigger value="general" className="flex items-center gap-2 flex-1">
                        <MessageCircle className="w-4 h-4" />
                        일반 댓글
                        <Badge variant="outline" className="ml-1">
                            스포일러 없음
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="spoiler" className="flex items-center gap-2 flex-1">
                        <AlertTriangle className="w-4 h-4" />
                        스포일러 댓글
                        {!hasGameHistory && <Lock className="w-3 h-3" />}
                        <Badge 
                            variant="outline" 
                            className={hasGameHistory ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-600"}
                        >
                            {hasGameHistory ? "열람 가능" : "잠김"}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-medium">일반 댓글</h3>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            스포일러 없음
                        </Badge>
                    </div>
                    <GeneralComments 
                        themeId={themeId}
                        hasGameHistory={hasGameHistory}
                    />
                </TabsContent>

                <TabsContent value="spoiler" className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-medium">스포일러 댓글</h3>
                        <Badge 
                            variant="outline" 
                            className={hasGameHistory ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-600"}
                        >
                            {hasGameHistory ? "열람 가능" : "플레이 후 열람"}
                        </Badge>
                    </div>

                    {!hasGameHistory ? (
                        <Card className="border-orange-200 bg-orange-50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-800">
                                    <Lock className="w-5 h-5" />
                                    스포일러 댓글 잠김
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center space-y-3">
                                    <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto" />
                                    <h4 className="font-medium text-orange-800">
                                        이 테마를 플레이한 후 확인하세요
                                    </h4>
                                    <p className="text-sm text-orange-700">
                                        스포일러가 포함된 댓글은 게임의 재미를 해칠 수 있습니다. 
                                        먼저 테마를 플레이한 후 다른 플레이어들의 경험과 팁을 확인해보세요.
                                    </p>
                                    <div className="pt-2">
                                        <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                            🔒 플레이 기록 등록 후 열람 가능
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <SpoilerComments 
                            themeId={themeId}
                            hasGameHistory={hasGameHistory}
                        />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CommentTabs;