import { LoaderCircle } from "lucide-react";

export default function LoginLoading() {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center">
            <LoaderCircle className="animate-spin w-12 h-12 mb-4 text-indigo-500" />
            <h1 className="text-xl font-semibold">로그인 처리 중...</h1>
            <p className="text-sm text-gray-500 mt-2">잠시만 기다려 주세요!</p>
        </div>
    );
}
