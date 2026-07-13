package com.n3v.ticket.services;

import com.n3v.ticket.common.exception.BadRequestException;
import com.n3v.ticket.common.exception.NotFoundException;
import com.n3v.ticket.dto.event.EventSeatRequest;
import com.n3v.ticket.dto.event.EventSeatResponse;
import com.n3v.ticket.dto.event.SeatBulkGenerateRequest;
import com.n3v.ticket.entities.EventSeat;
import com.n3v.ticket.entities.EventZone;
import com.n3v.ticket.enums.SeatStatus;
import com.n3v.ticket.enums.SeatTier;
import com.n3v.ticket.enums.SeatType;
import com.n3v.ticket.repositories.EventSeatRepository;
import com.n3v.ticket.repositories.EventZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventSeatService {

    private final EventSeatRepository seatRepository;
    private final EventZoneRepository zoneRepository;

    private EventZone findZone(Long zoneId) {
        return zoneRepository.findById(zoneId)
                .orElseThrow(() -> new NotFoundException("Khong tim thay khu vuc id = " + zoneId));
    }

    private EventSeat findSeat(Long zoneId, Long seatId) {
        EventSeat seat = seatRepository.findById(seatId)
                .orElseThrow(() -> new NotFoundException("Khong tim thay ghe/ban id = " + seatId));
        if (!seat.getEventZone().getId().equals(zoneId)) {
            throw new NotFoundException("Ghe/ban id = " + seatId + " khong thuoc khu vuc id = " + zoneId);
        }
        return seat;
    }

    private void validateSeatRequest(EventSeatRequest req) {
        if (req.getSeatType() == SeatType.TABLE && (req.getCapacity() == null || req.getCapacity() <= 0)) {
            throw new BadRequestException("Ban (TABLE) bat buoc phai nhap capacity > 0");
        }
    }

    public List<EventSeatResponse> getByZone(Long zoneId) {
        if (!zoneRepository.existsById(zoneId)) {
            throw new NotFoundException("Khong tim thay khu vuc id = " + zoneId);
        }
        return seatRepository.findByEventZoneIdOrderBySeatRowAscSeatColumnAsc(zoneId)
                .stream()
                .map(EventSeatResponse::from)
                .toList();
    }

    public EventSeatResponse create(Long zoneId, EventSeatRequest req) {
        EventZone zone = findZone(zoneId);
        validateSeatRequest(req);

        if (seatRepository.existsByEventZoneIdAndSeatCodeIgnoreCase(zoneId, req.getSeatCode())) {
            throw new BadRequestException("Ma ghe/ban \"" + req.getSeatCode() + "\" da ton tai trong khu vuc nay");
        }

        EventSeat seat = EventSeat.builder()
                .eventZone(zone)
                .seatType(req.getSeatType())
                .seatTier(req.getSeatTier() != null ? req.getSeatTier() : SeatTier.STANDARD)
                .seatRow(req.getSeatRow())
                .seatColumn(req.getSeatColumn())
                .seatCode(req.getSeatCode())
                .capacity(req.getSeatType() == SeatType.TABLE ? req.getCapacity() : null)
                .price(req.getPrice())
                .status(SeatStatus.AVAILABLE)
                .build();

        return EventSeatResponse.from(seatRepository.save(seat));
    }

    public List<EventSeatResponse> bulkGenerate(Long zoneId, SeatBulkGenerateRequest req) {
        EventZone zone = findZone(zoneId);

        List<EventSeat> newSeats = new ArrayList<>();
        for (String row : req.getRows()) {
            for (int col = 1; col <= req.getColumnsPerRow(); col++) {
                String seatCode = row + col;
                // Bo qua neu ma ghe da ton tai (cho phep goi lai bulk-generate nhieu lan
                // de "them" hang/cot moi ma khong bi trung).
                if (seatRepository.existsByEventZoneIdAndSeatCodeIgnoreCase(zoneId, seatCode)) {
                    continue;
                }
                newSeats.add(EventSeat.builder()
                        .eventZone(zone)
                        .seatType(SeatType.SEAT)
                        .seatTier(req.getSeatTier() != null ? req.getSeatTier() : SeatTier.STANDARD)
                        .seatRow(row)
                        .seatColumn(col)
                        .seatCode(seatCode)
                        .price(null) // lay gia theo zone
                        .status(SeatStatus.AVAILABLE)
                        .build());
            }
        }

        return seatRepository.saveAll(newSeats)
                .stream()
                .map(EventSeatResponse::from)
                .toList();
    }

    public EventSeatResponse update(Long zoneId, Long seatId, EventSeatRequest req) {
        EventSeat seat = findSeat(zoneId, seatId);
        validateSeatRequest(req);

        if (!seat.getSeatCode().equalsIgnoreCase(req.getSeatCode())
                && seatRepository.existsByEventZoneIdAndSeatCodeIgnoreCase(zoneId, req.getSeatCode())) {
            throw new BadRequestException("Ma ghe/ban \"" + req.getSeatCode() + "\" da ton tai trong khu vuc nay");
        }

        seat.setSeatType(req.getSeatType());
        seat.setSeatTier(req.getSeatTier() != null ? req.getSeatTier() : SeatTier.STANDARD);
        seat.setSeatRow(req.getSeatRow());
        seat.setSeatColumn(req.getSeatColumn());
        seat.setSeatCode(req.getSeatCode());
        seat.setCapacity(req.getSeatType() == SeatType.TABLE ? req.getCapacity() : null);
        seat.setPrice(req.getPrice());

        return EventSeatResponse.from(seatRepository.save(seat));
    }

    public void delete(Long zoneId, Long seatId) {
        EventSeat seat = findSeat(zoneId, seatId);
        // KHONG cho xoa ghe da SOLD/LOCKED de tranh vo du lieu don hang (module Dat ve).
        if (seat.getStatus() == SeatStatus.SOLD || seat.getStatus() == SeatStatus.LOCKED) {
            throw new BadRequestException("Khong the xoa ghe/ban dang o trang thai " + seat.getStatus());
        }
        seatRepository.delete(seat);
    }
}
