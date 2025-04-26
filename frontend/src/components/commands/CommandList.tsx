import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "@/lib/types";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isWithinDays, highlightMatch } from "@/utils/highlight";

interface CommandListProps {
    commands: Command[];
}

const CommandList: React.FC<CommandListProps> = ({ commands }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const categories = [
        "전체",
        ...new Set(commands.map((cmd) => cmd.category)),
    ];

    const filteredCommands = (category: string) => {
        return commands.filter((cmd) => {
            const matchesSearch =
                cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cmd.description
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
            const matchesCategory =
                category === "전체" || cmd.category === category;
            return matchesSearch && matchesCategory;
        });
    };

    return (
        <div className="w-full animate-fade-in">
            {/* 검색 바 */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    type="text"
                    placeholder="명령어 검색..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* 카테고리별 탭 */}
            <Tabs defaultValue="전체">
                <TabsList className="mb-6 flex flex-wrap">
                    {categories.map((category) => (
                        <TabsTrigger
                            key={category}
                            value={category}
                            className="px-4"
                        >
                            {category}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {categories.map((category) => (
                    <TabsContent
                        key={category}
                        value={category}
                        className="mt-0"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredCommands(category).length > 0 ? (
                                filteredCommands(category).map((command) => {
                                    const isNew = isWithinDays(
                                        command.createdAt,
                                        7
                                    );
                                    const isUpdated = isWithinDays(
                                        command.updatedAt,
                                        7
                                    );

                                    return (
                                        <Card
                                            key={command.id}
                                            className="card-hover overflow-hidden cursor-pointer"
                                            onClick={() =>
                                                navigate(
                                                    `/commands/${command.id}`
                                                )
                                            }
                                        >
                                            <CardHeader className="pb-2">
                                                <CardTitle className="flex justify-between items-start">
                                                    <div className="text-lg">
                                                        /
                                                        {highlightMatch(
                                                            command.name,
                                                            searchQuery
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-wrap justify-end">
                                                        {isNew && (
                                                            <span className="twinkle-badge twinkle-badge-yellow">
                                                                New
                                                            </span>
                                                        )}
                                                        {isUpdated &&
                                                            (!isNew ||
                                                                command.createdAt !==
                                                                    command.updatedAt) && (
                                                                <span className="twinkle-badge twinkle-badge-yellow">
                                                                    Updated
                                                                </span>
                                                            )}
                                                        <span className="text-xs font-normal text-muted-foreground px-2 py-1 bg-secondary rounded-full">
                                                            {command.category}
                                                        </span>
                                                    </div>
                                                </CardTitle>
                                                <CardDescription>
                                                    {highlightMatch(
                                                        command.description,
                                                        searchQuery
                                                    )}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-sm">
                                                    <p className="font-medium text-foreground/80 mb-1">
                                                        사용법:
                                                    </p>
                                                    <code className="p-2 rounded bg-secondary block text-xs overflow-x-auto">
                                                        {command.usageExample}
                                                    </code>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    명령어를 찾을 수 없습니다. 다른 검색어를
                                    입력해보세요.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default CommandList;
