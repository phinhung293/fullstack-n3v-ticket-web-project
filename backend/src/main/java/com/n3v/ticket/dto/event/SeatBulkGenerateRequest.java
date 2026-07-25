package com.n3v.ticket.dto.event;

import com.n3v.ticket.enums.SeatTier;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class SeatBulkGenerateRequest {

    @NotEmpty(message = "Vui long nhap danh sach ten hang, VD: [A, B, C]")
    private List<String> rows;

    @NotNull
    @Positive(message = "So cot phai > 0")
    private Integer columnsPerRow;

    // Ca lo ghe sinh ra trong 1 lan goi se cung 1 tier. Muon co ca VIP lan STANDARD
    // trong cung 1 zone thi goi bulk-generate 2 lan (VD hang A-C tier=VIP, hang D-H tier=STANDARD).
    @NotNull(message = "Vui long chon loai ve (VIP/STANDARD) cho lo ghe nay")
    private SeatTier seatTier;
}
