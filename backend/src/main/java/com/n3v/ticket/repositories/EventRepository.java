package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * JpaSpecificationExecutor cho phep dung EventSpecification de build query dong
 * (tim theo tu khoa, category, thanh pho, khoang thoi gian, status...).
 */
public interface EventRepository extends JpaRepository<Event, Long>, JpaSpecificationExecutor<Event> {
}
