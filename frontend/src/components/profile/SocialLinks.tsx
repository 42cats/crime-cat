import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Instagram,
    X,
    MessageCircleMore,
    Link as LinkIcon,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialLinksProps {
    instagram: string;
    twitter: string;
    discord: string;
    instagramValid: boolean | null;
    twitterValid: boolean | null;
    discordValid: boolean | null;
    setInstagram: (value: string) => void;
    setTwitter: (value: string) => void;
    setDiscord: (value: string) => void;
    validateInstagramUrl: (url: string) => void;
    validateTwitterUrl: (url: string) => void;
    validateDiscordUrl: (url: string) => void;
    isDark: boolean;
}

/**
 * 소셜 미디어 링크 입력 및 유효성 검사 컴포넌트
 */
const SocialLinks: React.FC<SocialLinksProps> = ({
    instagram,
    twitter,
    discord,
    instagramValid,
    twitterValid,
    discordValid,
    setInstagram,
    setTwitter,
    setDiscord,
    validateInstagramUrl,
    validateTwitterUrl,
    validateDiscordUrl,
    isDark,
}) => {
    return (
        <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                SNS 연동
            </Label>
            <div className="space-y-3 mt-2">
                {/* 인스타그램 링크 */}
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full text-white",
                            isDark
                                ? "bg-gradient-to-br from-pink-600 to-purple-600"
                                : "bg-gradient-to-br from-pink-500 to-purple-700"
                        )}
                    >
                        <Instagram className="w-4 h-4" />
                    </div>
                    <div className="relative flex-1">
                        <Input
                            placeholder="Instagram 링크 입력"
                            value={instagram}
                            onChange={(e) => {
                                setInstagram(e.target.value);
                                validateInstagramUrl(e.target.value);
                            }}
                            className={cn(
                                "flex-1 pr-10",
                                instagramValid === false &&
                                    "border-red-500 focus-visible:ring-red-500",
                                instagramValid === true &&
                                    "border-green-500 focus-visible:ring-green-500"
                            )}
                        />
                        {instagramValid !== null && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {instagramValid ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                            </div>
                        )}
                        {instagramValid === false && (
                            <p className="text-xs text-red-500 mt-1">
                                올바른 Instagram URL 형식이 아닙니다.
                            </p>
                        )}
                    </div>
                </div>

                {/* 트위터/X 링크 */}
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full text-white",
                            isDark ? "bg-black" : "bg-black"
                        )}
                    >
                        <X className="w-4 h-4" />
                    </div>
                    <div className="relative flex-1">
                        <Input
                            placeholder="X(트위터) 링크 입력"
                            value={twitter}
                            onChange={(e) => {
                                setTwitter(e.target.value);
                                validateTwitterUrl(e.target.value);
                            }}
                            className={cn(
                                "flex-1 pr-10",
                                twitterValid === false &&
                                    "border-red-500 focus-visible:ring-red-500",
                                twitterValid === true &&
                                    "border-green-500 focus-visible:ring-green-500"
                            )}
                        />
                        {twitterValid !== null && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {twitterValid ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                            </div>
                        )}
                        {twitterValid === false && (
                            <p className="text-xs text-red-500 mt-1">
                                올바른 X(트위터) URL 형식이 아닙니다.
                            </p>
                        )}
                    </div>
                </div>

                {/* 디스코드/카카오톡 링크 */}
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full text-white",
                            isDark
                                ? "bg-gradient-to-br from-green-600 to-blue-600"
                                : "bg-gradient-to-br from-green-500 to-blue-500"
                        )}
                    >
                        <MessageCircleMore className="w-4 h-4" />
                    </div>
                    <div className="relative flex-1">
                        <Input
                            placeholder="Discord 또는 카카오톡 링크"
                            value={discord}
                            onChange={(e) => {
                                setDiscord(e.target.value);
                                validateDiscordUrl(e.target.value);
                            }}
                            className={cn(
                                "flex-1 pr-10",
                                discordValid === false &&
                                    "border-red-500 focus-visible:ring-red-500",
                                discordValid === true &&
                                    "border-green-500 focus-visible:ring-green-500"
                            )}
                        />
                        {discordValid !== null && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {discordValid ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                )}
                            </div>
                        )}
                        {discordValid === false && (
                            <p className="text-xs text-red-500 mt-1">
                                올바른 Discord/카카오톡 URL 형식이 아닙니다.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialLinks;
