package com.n3v.ticket.services;

import com.n3v.ticket.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Luu file anh (thumbnail/banner su kien) vao thu muc local "uploads/" o goc backend,
 * tra ve URL dang "/uploads/{tenFileMoi}.{ext}" de FE luu vao thumbnailUrl/bannerUrl.
 *
 * Ghi chu: day la giai phap luu local phu hop moi truong dev/do an. Khi len production
 * nen thay bang cloud storage (Supabase Storage, S3...) de tranh mat file khi deploy lai.
 */
@Slf4j
@Service
public class UploadService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final List<String> ALLOWED_EXTENSIONS = List.of(".jpg", ".jpeg", ".png", ".webp", ".gif");

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui long chon file anh de upload");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Chi chap nhan file anh (JPEG, PNG, WEBP, GIF)");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        String extension = getExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BadRequestException("Duoi file khong hop le. Chi chap nhan: " + ALLOWED_EXTENSIONS);
        }

        try {
            Path dir = Paths.get(uploadDir);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }

            String newFileName = UUID.randomUUID() + extension.toLowerCase();
            Path target = dir.resolve(newFileName);
            file.transferTo(target);

            log.info("Da luu file upload: {}", target.toAbsolutePath());
            return "/uploads/" + newFileName;
        } catch (IOException e) {
            log.error("Loi khi luu file upload", e);
            throw new BadRequestException("Khong the luu file, vui long thu lai");
        }
    }

    private String getExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dotIndex);
    }
}