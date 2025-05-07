package com.crimecat.backend.storage;
import java.nio.file.Path;
import java.util.stream.Stream;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    void init();

//    String store(MultipartFile file);

//    void storeAt(MultipartFile file, String location) throws IOException;

    String storeAt(StorageFileType type, MultipartFile file, String filename);

    Stream<Path> loadAll();

    Path load(String filename);

    Resource loadAsResource(String filename);

    void deleteAll();

}