package com.n3v.ticket.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Danh muc / the loai su kien (VD: Am nhac, Hoi thao, Kich, The thao...)
 */
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    // dung cho URL than thien, VD: "am-nhac"
    @Column(unique = true, length = 120)
    private String slug;

    @Column(length = 500)
    private String description;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
