package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.category.CategoryRequest;
import com.n3v.ticket.dto.category.CategoryResponse;
import com.n3v.ticket.services.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Quan tri danh muc (ADMIN) - nam duoi "/api/admin/**" nen tu dong duoc
 * SecurityConfig bao ve bang hasRole("ADMIN"), khong can @PreAuthorize rieng.
 */
@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ApiResponse<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.success("Tao danh muc thanh cong", categoryService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryResponse> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.success("Cap nhat danh muc thanh cong", categoryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ApiResponse.successMessage("Xoa danh muc thanh cong");
    }
}