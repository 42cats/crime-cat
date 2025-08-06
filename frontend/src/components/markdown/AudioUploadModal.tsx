import React, { useState } from "react";
import { Upload, X, Music } from "lucide-react";

interface AudioUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (
        file: File,
        accessPolicy: "PUBLIC" | "PRIVATE"
    ) => Promise<void>;
    userRole: "USER" | "MANAGER" | "ADMIN";
}

/**
 * 오디오 파일 업로드 모달 컴포넌트
 */
const AudioUploadModal: React.FC<AudioUploadModalProps> = ({
    isOpen,
    onClose,
    onUpload,
    userRole,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [accessPolicy, setAccessPolicy] = useState<"PUBLIC" | "PRIVATE">(
        "PUBLIC"
    );
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allowedTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/ogg",
        "audio/m4a",
        "audio/aac",
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    const handleFileSelect = (selectedFile: File) => {
        setError(null); // Reset error on new file selection

        if (!allowedTypes.includes(selectedFile.type)) {
            setError(
                "지원하지 않는 오디오 형식입니다. (MP3, WAV, OGG, M4A, AAC만 지원)"
            );
            return;
        }

        if (selectedFile.size > maxSize) {
            setError("파일 크기가 너무 큽니다. (최대 50MB)");
            return;
        }

        setFile(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0 && files[0].type.startsWith("audio/")) {
            handleFileSelect(files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        try {
            await onUpload(file, accessPolicy);
            handleClose();
        } catch (error: any) {
            console.error("Upload failed:", error);
            const detail = error.response?.data?.detail || "업로드에 실패했습니다. 다시 시도해주세요.";
            setError(detail);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setAccessPolicy("PUBLIC");
        setUploading(false);
        setError(null); // Reset error on close
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        오디오 파일 업로드
                    </h3>
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 파일 드롭 영역 */}
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 transition-colors ${
                        dragOver
                            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-300 dark:border-gray-600"
                    }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    {file ? (
                        <div className="text-sm">
                            <Music className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <p className="font-medium">{file.name}</p>
                            <p className="text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(1)}MB
                            </p>
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <p className="mb-1">오디오 파일을 드래그하거나</p>
                            <label className="text-blue-500 hover:text-blue-600 cursor-pointer">
                                클릭해서 선택하세요
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="audio/*"
                                    onChange={(e) =>
                                        e.target.files?.[0] &&
                                        handleFileSelect(e.target.files[0])
                                    }
                                />
                            </label>
                            <p className="text-xs mt-2">
                                MP3, WAV, OGG, M4A, AAC (최대 50MB)
                            </p>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="text-red-500 text-sm text-center mb-4">
                        {error}
                    </div>
                )}


                {/* 접근 정책 선택 (ADMIN/MANAGER만) */}
                {(userRole === "ADMIN" || userRole === "MANAGER") && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            접근 정책
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="PUBLIC"
                                    checked={accessPolicy === "PUBLIC"}
                                    onChange={(e) =>
                                        setAccessPolicy(
                                            e.target.value as
                                                | "PUBLIC"
                                                | "PRIVATE"
                                        )
                                    }
                                    className="mr-2"
                                />
                                <span className="text-sm">
                                    공개 - 모든 사용자가 재생 가능
                                </span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="PRIVATE"
                                    checked={accessPolicy === "PRIVATE"}
                                    onChange={(e) =>
                                        setAccessPolicy(
                                            e.target.value as
                                                | "PUBLIC"
                                                | "PRIVATE"
                                        )
                                    }
                                    className="mr-2"
                                />
                                <span className="text-sm">
                                    비공개 - 로그인한 사용자만 재생 가능
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* 업로드 버튼 */}
                <div className="flex gap-2">
                    <button
                        onClick={handleClose}
                        disabled={uploading}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? "업로드 중..." : "업로드"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AudioUploadModal;
