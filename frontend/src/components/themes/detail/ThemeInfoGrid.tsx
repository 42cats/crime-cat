import React from "react";
import { Clock, Users, Tag, CreditCard, User, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CrimesceneThemeDetailType } from "@/lib/types";

interface ThemeInfoGridProps {
    theme: CrimesceneThemeDetailType;
    formatPlayTime: (min: number, max: number) => string;
}

// 별점 표시 컴포넌트
const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
    // 1-10 스케일을 0.5 단위로 표시 (5개 별 기준)
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 === 1;

    return (
        <div className="flex">
            {[...Array(5)].map((_, i) => {
                if (i < fullStars) {
                    // 꽉 찬 별
                    return (
                        <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                    );
                } else if (i === fullStars && hasHalfStar) {
                    // 반개 별 - CSS clip-path 사용하여 오른쪽 반개만 채움
                    return (
                        <div key={i} className="relative h-4 w-4">
                            {/* 빈 별 배경 */}
                            <Star className="h-4 w-4 text-muted-foreground absolute" />
                            {/* 반개 별 (왼쪽 반) */}
                            <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            </div>
                        </div>
                    );
                } else {
                    // 빈 별
                    return (
                        <Star
                            key={i}
                            className="h-4 w-4 text-muted-foreground"
                        />
                    );
                }
            })}
        </div>
    );
};

const ThemeInfoGrid: React.FC<ThemeInfoGridProps> = ({
    theme,
    formatPlayTime,
}) => {
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {/* 인원 정보 */}
                <div className="flex items-center p-4 bg-muted/40 rounded-lg">
                    <Users className="h-5 w-5 mr-3 text-primary" />
                    <div>
                        <div className="text-sm text-muted-foreground">
                            인원
                        </div>
                        <div className="font-medium">
                            {theme.playersMin === theme.playersMax
                                ? `${theme.playersMin}인`
                                : `${theme.playersMin}~${theme.playersMax}인`}
                        </div>
                    </div>
                </div>

                {/* 플레이 시간 */}
                <div className="flex items-center p-4 bg-muted/40 rounded-lg">
                    <Clock className="h-5 w-5 mr-3 text-primary" />
                    <div>
                        <div className="text-sm text-muted-foreground">
                            플레이 시간
                        </div>
                        <div className="font-medium">
                            {formatPlayTime(
                                theme.playTimeMin,
                                theme.playTimeMax
                            )}
                        </div>
                    </div>
                </div>

                {/* 가격 */}
                <div className="flex items-center p-4 bg-muted/40 rounded-lg">
                    <CreditCard className="h-5 w-5 mr-3 text-primary" />
                    <div>
                        <div className="text-sm text-muted-foreground">
                            가격
                        </div>
                        <div className="font-medium">
                            {typeof theme.price === "number"
                                ? `${theme.price.toLocaleString()}원`
                                : "정보 없음"}
                        </div>
                    </div>
                </div>

                {/* 난이도 */}
                <div className="flex items-center p-4 bg-muted/40 rounded-lg">
                    <Star className="h-5 w-5 mr-3 text-primary" />
                    <div>
                        <div className="text-sm text-muted-foreground">
                            난이도
                        </div>
                        <div className="font-medium flex items-center">
                            <RatingStars rating={theme.difficulty} />
                        </div>
                    </div>
                </div>

                {/* 태그 */}
                <div className="flex items-center p-4 bg-muted/40 rounded-lg">
                    <Tag className="h-5 w-5 mr-3 text-primary" />
                    <div>
                        <div className="text-sm text-muted-foreground">
                            태그
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {theme.tags && theme.tags.length > 0 ? (
                                theme.tags.map((tag, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="bg-primary/10 text-primary text-xs"
                                    >
                                        #{tag}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-muted-foreground text-sm">
                                    태그 없음
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 등장 캐릭터 (아래에 단독 배치) */}
            <div className="p-4 bg-muted/40 rounded-lg mb-6">
                <div className="flex items-center mb-2">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    <div className="text-sm text-muted-foreground">
                        등장 캐릭터
                    </div>
                    {theme.type === "CRIMESCENE" &&
                    theme.extra?.characters?.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-muted rounded-md">
                            {theme.extra.characters.map((char, idx) => (
                                <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="bg-muted/70 text-sm whitespace-nowrap"
                                >
                                    {char}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-sm">
                            비공개
                        </span>
                    )}
                </div>
            </div>
        </>
    );
};

export default ThemeInfoGrid;
