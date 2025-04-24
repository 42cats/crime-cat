package com.crimecat.backend.utils;

public class FileUtil {
    public static String getExtension(String filename) {
        int pos = filename.lastIndexOf('.');
        if (pos == -1) {
            return "";
        }
        return filename.substring(pos);
    }
}
