package com.n3v.ticket.controllers;

import com.n3v.ticket.common.ApiResponse;
import com.n3v.ticket.dto.category.CategoryRequest;
import com.n3v.ticket.dto.category.CategoryResponse;
import com.n3v.ticket.services.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Danh muc su kien. GET la public (khach can de hien bo loc),
 * POST/PUT/DELETE nen duoc bao ve bang Spring Security (hasRole ADMIN)
 * sau khi tich hop xong module Xac thuc.
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryResponse>> getAll() {
        return ApiResponse.success(categoryService.getAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> getById(@PathVariable Long id) {
        return ApiResponse.success(categoryService.getById(id));
    }

    // TODO: gioi han quyen ADMIN khi co Spring Security
    @PostMapping
    public ApiResponse<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.success("Tao danh muc thanh cong", categoryService.create(request));
    }

    // TODO: gioi han quyen ADMIN
    @PutMapping("/{id}")
    public ApiResponse<CategoryResponse> update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.success("Cap nhat danh muc thanh cong", categoryService.update(id, request));
    }

    // TODO: gioi han quyen ADMIN
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ApiResponse.successMessage("Xoa danh muc thanh cong");
    }
}
