package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.services.UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;

    @PostMapping("/image")
    public ApiResponse<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        String url = uploadService.storeImage(file);
        return ApiResponse.success("Upload anh thanh cong", Map.of("url", url));
    }
}