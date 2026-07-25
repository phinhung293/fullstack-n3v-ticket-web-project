package com.n3v.ticket.services;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class QrCodeService {

    public byte[] generatePng(
            String content,
            int width,
            int height
    ) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException(
                    "Nội dung QR không được để trống"
            );
        }

        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException(
                    "Kích thước QR phải lớn hơn 0"
            );
        }

        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();

            BitMatrix bitMatrix = qrCodeWriter.encode(
                    content,
                    BarcodeFormat.QR_CODE,
                    width,
                    height
            );

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            MatrixToImageWriter.writeToStream(
                    bitMatrix,
                    "PNG",
                    outputStream
            );

            return outputStream.toByteArray();
        } catch (Exception exception) {
            throw new RuntimeException(
                    "Không thể tạo ảnh mã QR",
                    exception
            );
        }
    }
}