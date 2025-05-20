package com.crimecat.backend.storage;

import com.crimecat.backend.utils.FileUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.stream.Stream;

@Slf4j
@Service
public class FileSystemStorageService implements StorageService {

    private final Path rootLocation;
    private final int rootIndex;

    @Autowired
    public FileSystemStorageService(StorageProperties properties) {

        if(properties.getLocation().trim().length() == 0){
            throw new RuntimeException("File upload location can not be Empty.");
        }

        this.rootLocation = Paths.get(properties.getLocation());
        this.rootIndex = this.rootLocation.getNameCount();
    }

//    @Override
//    public String store(MultipartFile file) {
//        return this.storeAt(file, null, file.getOriginalFilename());
//    }

    @Override
    public String storeAt(StorageFileType type, MultipartFile file, String filename) {
        Path savePath = this.rootLocation;
        savePath = savePath.resolve(type.getUploadDir());
        try {
            if (Files.notExists(savePath)) {
                Files.createDirectories(savePath);
            }
            savePath = savePath.resolve(filename + FileUtil.getExtension(file.getOriginalFilename()));
            if (file.isEmpty()) {
                throw new RuntimeException("Failed to store empty file " + file.getOriginalFilename());
            }
            Files.copy(file.getInputStream(), savePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + file.getOriginalFilename(), e);
        }
        return type.getBaseUrl() + filename + FileUtil.getExtension(file.getOriginalFilename());
    }

    @Override
    public Stream<Path> loadAll() {
        try {
            return Files.walk(this.rootLocation, 1)
                    .filter(path -> !path.equals(this.rootLocation))
                    .map(path -> this.rootLocation.relativize(path));
        } catch (IOException e) {
            throw new RuntimeException("Failed to read stored files", e);
        }

    }

    @Override
    public Path load(String filename) {
        return rootLocation.resolve(filename);
    }

    @Override
    public Resource loadAsResource(String filename) {
        try {
            Path file = load(filename);
            Resource resource = new UrlResource(file.toUri());
            if(resource.exists() || resource.isReadable()) {
                return resource;
            }
            else {
                throw new RuntimeException("Could not read file: " + filename);

            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Could not read file: " + filename, e);
        }
    }

    @Override
    public void deleteAll() {
        FileSystemUtils.deleteRecursively(rootLocation.toFile());
    }

    @Override
    public void init() {
        log.debug("init storage:: {}", rootLocation.toAbsolutePath());
        try {
            if (!Files.exists(rootLocation)) {
                Files.createDirectory(rootLocation);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    /**
     * 저장된 이미지를 타입, 파일 id(이름) 기반으로 실제 파일을 삭제합니다.
     */
    @Override
    public void delete(StorageFileType type, String filename) {
        try {
            Path filePath = rootLocation
                    .resolve(type.getUploadDir())
                    .resolve(filename);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted file: {}", filePath.toAbsolutePath());
            } else {
                log.warn("File not found: {}", filePath.toAbsolutePath());
            }

        } catch (IOException e) {
            log.error("Failed to delete file: {}", filename, e);
        }
    }


}
