import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageTransition from "@/components/PageTransition";
import { commandsService } from "@/api/commandsService";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, Trash, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { UTCToKST } from "@/lib/dateFormat";

const CommandDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { hasRole } = useAuth();
    const { toast } = useToast();

    const {
        data: command,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["command", id],
        queryFn: () =>
            id ? commandsService.getCommandById(id) : Promise.reject("No ID"),
        enabled: !!id,
    });

    const deleteMutation = useMutation({
        mutationFn: () => commandsService.deleteCommand(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["commands"] });
            navigate("/commands");
        },
    });

    const handleDelete = () => deleteMutation.mutate();
    const handleEdit = () =>
        navigate(`/commands/edit/${id}`, { state: { command } });

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({
                title: "링크 복사 완료",
                description: "페이지 링크가 복사되었습니다.",
            });
        } catch (err) {
            toast({
                title: "복사 실패",
                description: "클립보드 접근이 차단되었습니다.",
                variant: "destructive",
            });
        }
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        const isMobile =
            typeof window !== "undefined" && window.innerWidth < 768;
        return d.toLocaleString(
            "ko-KR",
            isMobile
                ? {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                  }
                : {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                  }
        );
    };

    if (isLoading) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-20">
                    <Skeleton className="h-10 w-1/2 mb-4" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </PageTransition>
        );
    }

    if (error || !command) {
        return (
            <PageTransition>
                <div className="container mx-auto px-6 py-20 text-center">
                    <h1 className="text-2xl font-bold mb-4">
                        명령어를 찾을 수 없습니다
                    </h1>
                    <Button onClick={() => navigate("/commands")}>
                        목록으로 돌아가기
                    </Button>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="container mx-auto px-6 py-20">
                <div className="max-w-3xl mx-auto space-y-8">
                    {/* Back */}
                    <Link
                        to="/commands"
                        className="inline-flex items-center text-muted-foreground hover:text-primary"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        목록으로 돌아가기
                    </Link>

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-bold break-keep">
                                /{command.name}
                            </h1>
                        </div>

                        <div className="flex flex-col gap-2 items-end text-right w-full sm:w-auto">
                            <div className="flex justify-end gap-2 flex-wrap">
                                {hasRole(["ADMIN", "MANAGER"]) && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="h-8 px-2 text-sm"
                                            onClick={handleEdit}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />{" "}
                                            수정
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="h-8 px-2 text-sm"
                                            onClick={handleDelete}
                                        >
                                            <Trash className="h-4 w-4 mr-1" />{" "}
                                            삭제
                                        </Button>
                                    </>
                                )}
                                <Button
                                    variant="outline"
                                    className="h-8 px-2 text-sm"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-4 w-4 mr-1" /> 공유
                                </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                <div>
                                    <strong>생성일</strong>{" "}
                                    <UTCToKST date={command.createdAt} />
                                </div>
                                <div>
                                    <strong>수정일</strong>{" "}
                                    <UTCToKST date={command.updatedAt} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 설명 */}
                    <section>
                        <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                            설명
                        </h2>
                        <p className="text-base text-foreground break-words whitespace-pre-line">
                            {command.description}
                        </p>
                    </section>

                    {/* 카테고리 */}
                    <section className="mt-6">
                        <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                            카테고리
                        </h2>
                        <Badge variant="secondary">{command.category}</Badge>
                    </section>

                    {/* 필수 권한 */}
                    {command.requiredPermissions?.length > 0 && (
                        <section className="mt-6">
                            <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                                필수 권한
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {command.requiredPermissions.map((perm) => (
                                    <span
                                        key={perm}
                                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                                    >
                                        {perm}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 사용법 */}
                    <section className="mt-6">
                        <h2 className="text-sm font-semibold text-muted-foreground mb-1">
                            사용법
                        </h2>
                        <code className="block bg-muted px-3 py-2 rounded text-foreground whitespace-pre-wrap">
                            {command.usageExample}
                        </code>
                    </section>

                    {/* 본문 */}
                    <section className="mt-6">
                        <h2 className="text-sm font-semibold text-muted-foreground mb-2">
                            내용
                        </h2>
                        <div className="prose max-w-none dark:prose-invert mt-2">
                            <MarkdownRenderer content={command.content} />
                        </div>
                    </section>
                </div>
            </div>
        </PageTransition>
    );
};

export default CommandDetail;
