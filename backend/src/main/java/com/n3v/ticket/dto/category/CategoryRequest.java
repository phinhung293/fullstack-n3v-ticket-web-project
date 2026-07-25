package com.n3v.ticket.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryRequest {

    @NotBlank(message = "Ten danh muc khong duoc de trong")
    @Size(max = 100, message = "Ten danh muc toi da 100 ky tu")
    private String name;

    @Size(max = 500, message = "Mo ta toi da 500 ky tu")
    private String description;

    private String iconUrl;
}
