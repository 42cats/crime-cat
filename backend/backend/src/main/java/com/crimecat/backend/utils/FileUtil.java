package com.crimecat.backend.utils;

public class FileUtil {
    /**
     * 파일로부터 확장자를 추출합니다.
     * 경로 구분자를 포함한 전체 경로를 전달해도 확장자만 추출합니다.
     * 
     * @param filename 파일명 또는 경로
     * @return 파일 확장자 (예: .jpg, .png 등). 점(.)을 포함합니다.
     */
    public static String getExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        
        // 경로 구분자 처리
        String name = filename;
        int pathSeparatorPos = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
        if (pathSeparatorPos > -1) {
            name = filename.substring(pathSeparatorPos + 1);
        }
        
        // 확장자 추출
        int dotPos = name.lastIndexOf('.');
        if (dotPos == -1 || dotPos == 0) { // 점이 없거나 점으로 시작하는 파일명은 확장자 없음
            return "";
        }
        
        return name.substring(dotPos);
    }
    
    /**
     * 파일명에서 확장자를 제외한 순수 파일명 부분만 반환합니다.
     * 
     * @param filename 파일명 또는 경로
     * @return 확장자를 제외한 파일명
     */
    public static String getNameWithoutExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        
        // 경로 구분자 처리
        String name = filename;
        int pathSeparatorPos = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
        if (pathSeparatorPos > -1) {
            name = filename.substring(pathSeparatorPos + 1);
        }
        
        // 확장자 제거
        int dotPos = name.lastIndexOf('.');
        if (dotPos == -1 || dotPos == 0) { // 점이 없거나 점으로 시작하는 파일명은 전체 반환
            return name;
        }
        
        return name.substring(0, dotPos);
    }
}
