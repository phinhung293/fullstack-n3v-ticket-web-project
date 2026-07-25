package com.n3v.ticket.services;

import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.dto.category.CategoryRequest;
import com.n3v.ticket.dto.category.CategoryResponse;
import com.n3v.ticket.entities.Category;
import com.n3v.ticket.repositories.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    private Category findEntityById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Khong tim thay danh muc id = " + id));
    }

    public List<CategoryResponse> getAll() {
        return categoryRepository.findAll()
                .stream()
                .map(CategoryResponse::from)
                .toList();
    }

    public CategoryResponse getById(Long id) {
        return CategoryResponse.from(findEntityById(id));
    }

    public CategoryResponse create(CategoryRequest req) {
        if (categoryRepository.existsByNameIgnoreCase(req.getName())) {
            throw new BadRequestException("Danh muc \"" + req.getName() + "\" da ton tai");
        }

        Category category = Category.builder()
                .name(req.getName())
                .description(req.getDescription())
                .iconUrl(req.getIconUrl())
                .slug(toSlug(req.getName()))
                .build();

        return CategoryResponse.from(categoryRepository.save(category));
    }

    public CategoryResponse update(Long id, CategoryRequest req) {
        Category category = findEntityById(id);

        category.setName(req.getName());
        category.setDescription(req.getDescription());
        category.setIconUrl(req.getIconUrl());
        category.setSlug(toSlug(req.getName()));

        return CategoryResponse.from(categoryRepository.save(category));
    }

    public void delete(Long id) {
        Category category = findEntityById(id);
        // Neu category dang co event tham chieu, xoa se bao loi FK constraint -
        // day la hanh vi mong muon (khong cho xoa danh muc dang duoc su dung).
        categoryRepository.delete(category);
    }

    private String toSlug(String input) {
        String noAccent = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        noAccent = noAccent.replace("đ", "d").replace("Đ", "D");
        return noAccent.toLowerCase().trim()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-");
    }
}
