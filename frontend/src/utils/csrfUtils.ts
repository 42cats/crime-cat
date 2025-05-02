import { apiClient } from "@/lib/api";

/**
 * CSRF 토큰을 서버에서 가져와 쿠키에 설정하는 함수
 * 애플리케이션 시작 시 호출하여 CSRF 보호를 활성화
 */
export const fetchCsrfToken = async (): Promise<void> => {
    try {
        // 스프링에서 제공하는 CSRF 토큰 엔드포인트 호출
        // 일반적으로 GET 요청을 보내면 서버가 XSRF-TOKEN 쿠키를 설정
        await apiClient.get("/csrf/token");
        console.log("CSRF 토큰 설정 완료");
    } catch (error) {
        console.error("CSRF 토큰 설정 실패:", error);
    }
};

/**
 * 현재 설정된 CSRF 토큰을 쿠키에서 가져오는 함수
 * 필요할 때 직접 토큰을 사용해야 하는 경우 호출
 */
export const getCsrfToken = (): string | undefined => {
    return document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];
};

/**
 * HTML 폼 요소에 CSRF 토큰을 추가하는 함수
 * @param form HTML 폼 요소
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
 * @param formData FormData 객체
 */
export const addCsrfTokenToFormData = (formData: FormData): void => {
    const token = getCsrfToken();
    if (token) {
        formData.append("_csrf", token);
    }
};
