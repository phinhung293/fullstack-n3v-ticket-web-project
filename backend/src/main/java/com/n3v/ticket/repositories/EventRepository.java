package com.n3v.ticket.repositories;

import com.n3v.ticket.entities.Event;
import com.n3v.ticket.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    /**
     * Danh sách vận hành check-in: sự kiện chưa kết thúc và bắt đầu
     * trước giới hạn hiển thị (hết ngày mai).
     */
    @Query("""
        SELECT event
        FROM Event event
        WHERE event.status IN :statuses
          AND event.endTime >= :now
          AND event.startTime < :visibleUntil
        ORDER BY event.startTime ASC
    """)
    List<Event> findEventsAvailableForCheckIn(
            @Param("statuses") Collection<EventStatus> statuses,
            @Param("now") LocalDateTime now,
            @Param("visibleUntil") LocalDateTime visibleUntil
    );

    List<Event> findTop5ByStatusInAndEndTimeGreaterThanEqualOrderByStartTimeAsc(
            Collection<EventStatus> statuses,
            LocalDateTime now
    );
}
