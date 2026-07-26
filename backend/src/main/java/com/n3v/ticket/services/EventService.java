package com.n3v.ticket.services;

import com.n3v.ticket.common.EventTimeUtils;
import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.ConflictException;
import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.dto.event.EventCreateRequest;
import com.n3v.ticket.dto.event.EventResponse;
import com.n3v.ticket.dto.event.EventSummaryResponse;
import com.n3v.ticket.dto.event.EventUpdateRequest;
import com.n3v.ticket.entities.Category;
import com.n3v.ticket.entities.Event;
import com.n3v.ticket.enums.EventStatus;
import com.n3v.ticket.enums.TicketMapType;
import com.n3v.ticket.repositories.CategoryRepository;
import com.n3v.ticket.repositories.EventRepository;
import com.n3v.ticket.repositories.UserRepository;
import com.n3v.ticket.specifications.EventSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    /**
     * Bang trang thai duoc phep chuyen toi. Dat o day de de doc/de test,
     * khong ran trai code nhu 1 chuoi if-else dai.
     */
    private static final Map<EventStatus, EnumSet<EventStatus>> ALLOWED_TRANSITIONS = new EnumMap<>(EventStatus.class);

    static {
        ALLOWED_TRANSITIONS.put(EventStatus.DRAFT, EnumSet.of(EventStatus.PUBLISHED, EventStatus.CANCELLED));
        ALLOWED_TRANSITIONS.put(EventStatus.PUBLISHED, EnumSet.of(EventStatus.ONGOING, EventStatus.CANCELLED, EventStatus.DRAFT));
        ALLOWED_TRANSITIONS.put(EventStatus.ONGOING, EnumSet.of(EventStatus.COMPLETED, EventStatus.CANCELLED));
        ALLOWED_TRANSITIONS.put(EventStatus.COMPLETED, EnumSet.noneOf(EventStatus.class));
        ALLOWED_TRANSITIONS.put(EventStatus.CANCELLED, EnumSet.noneOf(EventStatus.class));
    }

    private Event findEntity(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Khong tim thay su kien id = " + id));
    }

    private void validateTimeRange(LocalDateTime start, LocalDateTime end) {
        if (start != null && end != null && !end.isAfter(start)) {
            throw new BadRequestException("Thoi gian ket thuc phai sau thoi gian bat dau");
        }
    }

    /** Dong ban ve khong duoc muon hon thoi gian ket thuc su kien. */
    private void validateSaleEndTime(LocalDateTime saleEndTime, LocalDateTime endTime) {
        if (saleEndTime != null && endTime != null && saleEndTime.isAfter(endTime)) {
            throw new BadRequestException("Thoi gian dong ban ve khong duoc muon hon thoi gian ket thuc su kien");
        }
    }

    /** Chi ap dung khi TAO MOI: khong cho startTime/endTime la ngay trong qua khu. Khi SUA,
     *  su kien co the dang ONGOING (da bat dau that su) nen khong ap dung rule nay. */
    private void validateNotInPast(LocalDateTime start, LocalDateTime end) {
        LocalDateTime now = LocalDateTime.now();
        if (start != null && start.isBefore(now)) {
            throw new BadRequestException("Thoi gian bat dau khong duoc la ngay trong qua khu");
        }
        if (end != null && end.isBefore(now)) {
            throw new BadRequestException("Thoi gian ket thuc khong duoc la ngay trong qua khu");
        }
    }

    /** Danh sach cong khai cho khach - chi thay PUBLISHED/ONGOING, va AN Event da het han mua ve. */
    public Page<EventSummaryResponse> searchPublic(String keyword, Long categoryId, String city,
                                                   TicketMapType ticketMapType,
                                                   LocalDateTime from, LocalDateTime to,
                                                   Pageable pageable) {
        var spec = EventSpecification.build(
                keyword, categoryId, city,
                null, List.of(EventStatus.PUBLISHED, EventStatus.ONGOING),
                ticketMapType, from, to,
                LocalDateTime.now()
        );
        return eventRepository.findAll(spec, pageable).map(EventSummaryResponse::from);
    }

    /** Danh sach cho admin - xem duoc tat ca status (ke ca da het han mua ve), filter them theo status cu the. */
    public Page<EventSummaryResponse> searchAdmin(String keyword, Long categoryId, String city,
                                                  EventStatus status, TicketMapType ticketMapType,
                                                  LocalDateTime from, LocalDateTime to,
                                                  Pageable pageable) {
        var spec = EventSpecification.build(keyword, categoryId, city, status, null, ticketMapType, from, to, null);
        return eventRepository.findAll(spec, pageable).map(EventSummaryResponse::from);
    }

    public EventResponse getById(Long id) {
        return EventResponse.from(findEntity(id));
    }

    /**
     * Chi tiet su kien CHO KHACH - an hoan toan neu Event khong o trang thai
     * PUBLISHED/ONGOING, hoac da qua han mua ve (isExpired). Tra loi y het truong hop
     * "khong tim thay" de khong lo thong tin ve su ton tai cua Event dang DRAFT/CANCELLED.
     */
    public EventResponse getPublicById(Long id) {
        Event event = findEntity(id);
        boolean isPublicStatus = event.getStatus() == EventStatus.PUBLISHED
                || event.getStatus() == EventStatus.ONGOING;
        boolean expired = EventTimeUtils.isExpired(event.getSaleEndTime(), event.getEndTime());

        if (!isPublicStatus || expired) {
            throw new NotFoundException("Khong tim thay su kien id = " + id);
        }
        return EventResponse.from(event);
    }

    @Transactional
    public EventResponse create(EventCreateRequest req, String creatorEmail) {
        validateTimeRange(req.getStartTime(), req.getEndTime());
        validateNotInPast(req.getStartTime(), req.getEndTime());
        validateSaleEndTime(req.getSaleEndTime(), req.getEndTime());

        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Khong tim thay danh muc id = " + req.getCategoryId()));

        // Lay id nguoi tao tu Authentication (email trong JWT), khong nhan truc tiep tu FE
        // de tranh gia mao created_by (VD gui createdBy cua nguoi khac qua Postman).
        Long creatorId = userRepository.findByEmail(creatorEmail)
                .orElseThrow(() -> new NotFoundException("Khong tim thay nguoi dung dang dang nhap"))
                .getId();

        Event event = Event.builder()
                .name(req.getName())
                .description(req.getDescription())
                .thumbnailUrl(req.getThumbnailUrl())
                .bannerUrl(req.getBannerUrl())
                .category(category)
                .venueName(req.getVenueName())
                .address(req.getAddress())
                .city(req.getCity())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .saleStartTime(req.getSaleStartTime())
                .saleEndTime(req.getSaleEndTime())
                .ticketMapType(req.getTicketMapType())
                .status(EventStatus.DRAFT)
                .createdBy(creatorId)
                .build();

        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public EventResponse update(Long id, EventUpdateRequest req) {
        Event event = findEntity(id);

        // Khong cho sua su kien da CANCELLED/COMPLETED (da "chot" du lieu).
        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
            throw new ConflictException("Khong the chinh sua su kien dang o trang thai " + event.getStatus());
        }

        validateTimeRange(req.getStartTime(), req.getEndTime());
        validateSaleEndTime(req.getSaleEndTime(), req.getEndTime());
        boolean alreadyStarted = event.getStartTime() != null && event.getStartTime().isBefore(LocalDateTime.now());
        if (!alreadyStarted) {
            validateNotInPast(req.getStartTime(), req.getEndTime());
        }

        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Khong tim thay danh muc id = " + req.getCategoryId()));

        event.setName(req.getName());
        event.setDescription(req.getDescription());
        event.setThumbnailUrl(req.getThumbnailUrl());
        event.setBannerUrl(req.getBannerUrl());
        event.setCategory(category);
        event.setVenueName(req.getVenueName());
        event.setAddress(req.getAddress());
        event.setCity(req.getCity());
        event.setStartTime(req.getStartTime());
        event.setEndTime(req.getEndTime());
        event.setSaleStartTime(req.getSaleStartTime());
        event.setSaleEndTime(req.getSaleEndTime());
        // Co tinh khong cho doi ticketMapType khi update: neu zone/seat da duoc tao
        // theo 1 kieu so do, doi kieu giua chung se lam sai logic hien thi & dat ve.

        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public EventResponse changeStatus(Long id, EventStatus newStatus) {
        Event event = findEntity(id);
        EventStatus current = event.getStatus();

        if (current == newStatus) {
            return EventResponse.from(event); // idempotent, khong coi la loi
        }

        EnumSet<EventStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(current, EnumSet.noneOf(EventStatus.class));
        if (!allowed.contains(newStatus)) {
            throw new ConflictException("Khong the chuyen trang thai tu " + current + " sang " + newStatus);
        }

        // Rang buoc nghiep vu: khong cho PUBLISH neu su kien chua co khu vuc/gia ve nao.
        if (newStatus == EventStatus.PUBLISHED && event.getZones().isEmpty()) {
            throw new BadRequestException("Su kien can it nhat 1 khu vuc/gia ve truoc khi Publish");
        }

        event.setStatus(newStatus);
        return EventResponse.from(eventRepository.save(event));
    }

    @Transactional
    public void delete(Long id) {
        Event event = findEntity(id);
        // Chi cho xoa cung khi con DRAFT - da PUBLISHED tro di nen dung "Huy" (CANCELLED)
        // thay vi xoa cung, de giu lich su cho bao cao/doanh thu (module Nguyen).
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new BadRequestException(
                    "Chi co the xoa cung su kien dang o trang thai DRAFT. Su kien da Publish (ke ca da CANCELLED) "
                            + "duoc giu lai de phuc vu bao cao/doanh thu, khong the xoa - CANCELLED la trang thai "
                            + "ket thuc thay the cho xoa, khong phai buoc trung gian truoc khi xoa.");
        }
        eventRepository.delete(event);
    }
}