import { apiClient } from "@/lib/api";

/**
 * CSRF 토큰을 서버에서 가져와 저장하는 함수
 * 세션스토리지에 토큰이 있으면 재사용, 없을 때만 서버에 요청
 */
export const fetchCsrfToken = async (): Promise<string | undefined> => {
    try {
        // 1. 세션스토리지에 토큰이 있는지 먼저 확인
        const existingToken = sessionStorage.getItem("csrfToken");
        if (existingToken) {
            console.log("세션스토리지에 저장된 CSRF 토큰 사용");
            return existingToken;
        }

        // 2. 토큰이 없는 경우에만 서버에 요청
        const response = await apiClient.get("/csrf/token");

        // 3. 응답 헤더에서 토큰 가져오기 시도
        const headerToken =
            response.headers && response.headers["x-csrf-token"];

        // 4. 쿠키에서 토큰 확인 (백업)
        const cookieToken = getCsrfTokenFromCookie();

        // 5. 헤더 또는 쿠키에서 가져온 토큰 사용
        const token = headerToken || cookieToken;

        if (token) {
            // 토큰을 세션스토리지에 저장
            sessionStorage.setItem("csrfToken", token);
            console.log("CSRF 토큰 설정 완료: 토큰이 저장됨");
            return token;
        } else {
            console.warn("CSRF 토큰 응답에 토큰이 없음");
            return undefined;
        }
    } catch (error) {
        console.error("CSRF 토큰 설정 실패:", error);
        throw error; // 호출자가 오류를 처리할 수 있도록
    }
};

/**
 * 세션스토리지에서 CSRF 토큰을 가져오는 함수
 */
export const getCsrfToken = (): string | undefined => {
    // 1. 세션스토리지에서 토큰 가져오기 시도
    const sessionToken = sessionStorage.getItem("csrfToken");

    // 2. 세션스토리지에 있으면 그것을 반환
    if (sessionToken) {
        return sessionToken;
    }

    // 3. 없으면 쿠키에서 가져오기 시도
    const cookieToken = getCsrfTokenFromCookie();

    // 4. 쿠키에서 가져온 토큰이 있으면 세션스토리지에 저장
    if (cookieToken) {
        sessionStorage.setItem("csrfToken", cookieToken);
    }

    return cookieToken;
};

/**
 * 쿠키에서 CSRF 토큰을 가져오는 함수
 */
export const getCsrfTokenFromCookie = (): string | undefined => {
    return document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];
};

/**
 * CSRF 토큰을 제거하는 함수 (로그아웃 시 호출)
 */
export const clearCsrfToken = (): void => {
    sessionStorage.removeItem("csrfToken");
    console.log("CSRF 토큰이 세션스토리지에서 제거됨");
};

/**
 * HTML 폼 요소에 CSRF 토큰을 추가하는 함수
 */
export const addCsrfTokenToForm = (form: HTMLFormElement): void => {
    const token = getCsrfToken();
    if (!token) return;

    let inputElement = form.querySelector('input[name="_csrf"]');

    if (!inputElement) {
        inputElement = document.createElement("input");
        inputElement.setAttribute("type", "hidden");
        inputElement.setAttribute("name", "_csrf");
        form.appendChild(inputElement);
    }

    inputElement.setAttribute("value", token);
};

/**
 * FormData 객체에 CSRF 토큰을 추가하는 함수
 */
export const addCsrfTokenToFormData = (formData: FormData): void => {
    const token = getCsrfToken();
    if (token) {
        formData.append("_csrf", token);
    }
};
