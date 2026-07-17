package com.n3v.ticket.common;

/**
 * Chuẩn nội dung QR dùng chung cho trang Vé của tôi, PDF email
 * và máy quét check-in của admin.
 */
public final class TicketQrPayload {

    public static final String PREFIX = "N3V:TICKET:";

    private TicketQrPayload() {
    }

    public static String fromToken(String qrToken) {
        if (qrToken == null || qrToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Mã định danh QR không được để trống"
            );
        }

        return PREFIX + qrToken.trim();
    }

    public static String extractToken(String qrContent) {
        if (qrContent == null || !qrContent.startsWith(PREFIX)) {
            throw new IllegalArgumentException(
                    "Định dạng mã QR không hợp lệ"
            );
        }

        String qrToken = qrContent
                .substring(PREFIX.length())
                .trim();

        if (qrToken.isBlank()) {
            throw new IllegalArgumentException(
                    "Mã QR không hợp lệ"
            );
        }

        return qrToken;
    }
}
