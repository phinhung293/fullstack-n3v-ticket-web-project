package com.n3v.ticket.specifications;

import com.n3v.ticket.entities.Event;
import com.n3v.ticket.enums.EventStatus;
import com.n3v.ticket.enums.TicketMapType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Build query dong (JPA Specification) cho API tim kiem/loc su kien.
 * Moi method tra ve 1 Specification rieng le, dung EventSpecification.build(...)
 * de gop tat ca dieu kien lai (dieu kien nao null se bi bo qua).
 */
public class EventSpecification {

    private EventSpecification() {
    }

    public static Specification<Event> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return null;
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("venueName")), pattern),
                    cb.like(cb.lower(root.get("address")), pattern)
            );
        };
    }

    public static Specification<Event> hasCategory(Long categoryId) {
        return (root, query, cb) -> {
            if (categoryId == null) return null;
            return cb.equal(root.get("category").get("id"), categoryId);
        };
    }

    public static Specification<Event> hasCity(String city) {
        return (root, query, cb) -> {
            if (city == null || city.isBlank()) return null;
            return cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase());
        };
    }

    public static Specification<Event> hasStatus(EventStatus status) {
        return (root, query, cb) -> {
            if (status == null) return null;
            return cb.equal(root.get("status"), status);
        };
    }

    /**
     * Loc theo nhieu status cung luc, VD trang chu chi hien PUBLISHED + ONGOING.
     */
    public static Specification<Event> hasStatusIn(List<EventStatus> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) return null;
            return root.get("status").in(statuses);
        };
    }

    public static Specification<Event> hasTicketMapType(TicketMapType type) {
        return (root, query, cb) -> {
            if (type == null) return null;
            return cb.equal(root.get("ticketMapType"), type);
        };
    }

    public static Specification<Event> startsFrom(LocalDateTime from) {
        return (root, query, cb) -> {
            if (from == null) return null;
            return cb.greaterThanOrEqualTo(root.get("startTime"), from);
        };
    }

    public static Specification<Event> startsBefore(LocalDateTime to) {
        return (root, query, cb) -> {
            if (to == null) return null;
            return cb.lessThanOrEqualTo(root.get("startTime"), to);
        };
    }

    /**
     * Loai bo Event da qua han mua ve (saleEndTime < excludeExpiredAt) khoi ket qua.
     * Chi truyen excludeExpiredAt (thuong la LocalDateTime.now()) cho query CONG KHAI
     * (PublicEventController) - Admin can thay ca Event het han de con quan ly/gia han,
     * nen searchAdmin truyen null cho tham so nay (bo qua dieu kien).
     */
    public static Specification<Event> notExpired(LocalDateTime excludeExpiredAt) {
        return (root, query, cb) -> {
            if (excludeExpiredAt == null) return null;
            return cb.or(
                    cb.isNull(root.get("saleEndTime")),
                    cb.greaterThan(root.get("saleEndTime"), excludeExpiredAt)
            );
        };
    }

    /**
     * Gop tat ca dieu kien (bo qua dieu kien null) thanh 1 Specification duy nhat.
     */
    public static Specification<Event> build(String keyword, Long categoryId, String city,
                                               EventStatus status, List<EventStatus> statusIn,
                                               TicketMapType ticketMapType,
                                               LocalDateTime from, LocalDateTime to,
                                               LocalDateTime excludeExpiredAt) {
        List<Specification<Event>> specs = new ArrayList<>();
        specs.add(hasKeyword(keyword));
        specs.add(hasCategory(categoryId));
        specs.add(hasCity(city));
        specs.add(hasStatus(status));
        specs.add(hasStatusIn(statusIn));
        specs.add(hasTicketMapType(ticketMapType));
        specs.add(startsFrom(from));
        specs.add(startsBefore(to));
        specs.add(notExpired(excludeExpiredAt));

        Specification<Event> result = Specification.unrestricted();
        for (Specification<Event> s : specs) {
            if (s != null) {
                result = result.and(s);
            }
        }
        return result;
    }
}
