package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.Event;
import com.n3v.ticket.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * JpaSpecificationExecutor cho phép dùng EventSpecification
 * để build query động.
 */
public interface EventRepository
        extends JpaRepository<Event, Long>,
        JpaSpecificationExecutor<Event> {

    /**
     * Tìm sự kiện có thời gian bắt đầu nằm trong một khoảng.
     *
     * Scheduler dùng query này cho lời nhắc 24 giờ và 2 giờ.
     */
    List<Event> findByStatusInAndStartTimeGreaterThanEqualAndStartTimeLessThan(
            Collection<EventStatus> statuses,
            LocalDateTime fromTime,
            LocalDateTime toTime
    );
}