package com.n3v.ticket.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(JdbcTemplate jdbcTemplate, PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        Long userRoleId = ensureRoleExists(
                "ROLE_USER",
                "Người dùng thường"
        );

        Long adminRoleId = ensureRoleExists(
                "ROLE_ADMIN",
                "Quản trị viên"
        );

        createAdminAccountIfNotExists(adminRoleId);

        System.out.println("Admin account ready:");
        System.out.println("Email: admin@n3v.com");
        System.out.println("Password: Admin@123");
    }

    private Long ensureRoleExists(String roleName, String description) {
        List<Long> roleIds = jdbcTemplate.query(
                "SELECT id FROM roles WHERE name = ?",
                (rs, rowNum) -> rs.getLong("id"),
                roleName
        );

        if (!roleIds.isEmpty()) {
            return roleIds.get(0);
        }

        jdbcTemplate.update(
                """
                INSERT INTO roles (name, description)
                VALUES (?, ?)
                """,
                roleName,
                description
        );

        return jdbcTemplate.queryForObject(
                "SELECT id FROM roles WHERE name = ?",
                Long.class,
                roleName
        );
    }

    private void createAdminAccountIfNotExists(Long adminRoleId) {
        String adminEmail = "admin@n3v.com";

        Integer adminCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = ?",
                Integer.class,
                adminEmail
        );

        if (adminCount != null && adminCount == 0) {
            jdbcTemplate.update(
                    """
                    INSERT INTO users
                    (
                        email,
                        password_hash,
                        full_name,
                        phone,
                        status,
                        created_at,
                        updated_at,
                        role_id
                    )
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?)
                    """,
                    adminEmail,
                    passwordEncoder.encode("Admin@123"),
                    "Admin N3V",
                    "0999999999",
                    "ACTIVE",
                    adminRoleId
            );

            return;
        }

        jdbcTemplate.update(
                """
                UPDATE users
                SET
                    role_id = ?,
                    status = 'ACTIVE',
                    updated_at = NOW()
                WHERE email = ?
                """,
                adminRoleId,
                adminEmail
        );
    }
}