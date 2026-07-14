package com.n3v.ticket.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.n3v.ticket.entities.Order;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.core.io.ByteArrayResource;

import java.io.ByteArrayOutputStream;

import com.n3v.ticket.repositories.EventZoneRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final EventZoneRepository eventZoneRepository;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public void sendRegisterOtpEmail(String toEmail, String fullName, String otpCode) {
        sendOtpEmail(
                toEmail,
                fullName,
                otpCode,
                "[N3V Ticket] Mã xác thực đăng ký tài khoản",
                "Mã xác thực đăng ký tài khoản của bạn là: ",
                "OTP đăng ký tài khoản"
        );
    }

    public void sendOtpEmail(String toEmail, String fullName, String otpCode) {
        sendOtpEmail(
                toEmail,
                fullName,
                otpCode,
                "[N3V Ticket] Mã xác minh đặt lại mật khẩu",
                "Mã xác minh đặt lại mật khẩu của bạn là: ",
                "OTP đặt lại mật khẩu"
        );
    }

    private void sendOtpEmail(
            String toEmail,
            String fullName,
            String otpCode,
            String subject,
            String contentPrefix,
            String logLabel
    ) {
        /*
         * Luôn in OTP ra Console để test.
         * Nếu Gmail gửi lỗi thì vẫn có thể lấy OTP trong log backend để nhập thử.
         */
        log.warn("{} cho email {} là: {}", logLabel, toEmail, otpCode);

        if (!StringUtils.hasText(mailUsername)) {
            log.warn("Chưa cấu hình spring.mail.username, chỉ in OTP ra Console.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUsername);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(
                    "Chào " + fullName + ",\n\n"
                            + contentPrefix + otpCode + "\n"
                            + "Mã có hiệu lực trong 5 phút.\n\n"
                            + "Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\n"
                            + "N3V Ticket"
            );

            mailSender.send(message);
            log.info("Đã gửi {} tới email {}", logLabel, toEmail);
        } catch (MailException ex) {
            log.error("Gửi email OTP thất bại. OTP vẫn đã được tạo để test. Email: {}, OTP: {}", toEmail, otpCode, ex);
        }
    }

    public void sendTicketEmail(Order order) {
        if (!StringUtils.hasText(mailUsername)) return;
        
        try {
            String eventName = "Sự kiện N3V";
            if (!order.getOrderItems().isEmpty()) {
                var firstItem = order.getOrderItems().get(0);
                if (firstItem.getSeat() != null) {
                    eventName = firstItem.getSeat().getEventZone().getEvent().getName();
                } else if (firstItem.getEventZone() != null) {
                    var zone = firstItem.getEventZone();
                    if (zone != null) {
                        eventName = zone.getEvent().getName();
                    }
                }
            }
            
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(order.getOrderCode(), BarcodeFormat.QR_CODE, 200, 200);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] qrCodeImage = pngOutputStream.toByteArray();

            ByteArrayOutputStream pdfOutputStream = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(pdfOutputStream);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            
            document.add(new Paragraph("VE DIEN TU - N3V TICKET"));
            document.add(new Paragraph("Su kien: " + eventName));
            document.add(new Paragraph("Ma don hang: " + order.getOrderCode()));
            document.add(new Paragraph("Vui long xuat trinh ma QR nay khi vao cong."));
            
            com.itextpdf.io.image.ImageData imageData = com.itextpdf.io.image.ImageDataFactory.create(qrCodeImage);
            com.itextpdf.layout.element.Image pdfImage = new com.itextpdf.layout.element.Image(imageData);
            document.add(pdfImage);
            
            document.close();

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(mailUsername);
            helper.setTo(order.getUser().getEmail());
            helper.setSubject("[N3V Ticket] Xác nhận đặt vé thành công - " + eventName);
            
            String htmlMsg = "<h3>Cảm ơn bạn đã mua vé tại N3V Ticket!</h3>"
                    + "<p>Thông tin sự kiện: " + eventName + "</p>"
                    + "<p>Mã đơn hàng: " + order.getOrderCode() + "</p>"
                    + "<p>Vui lòng xem vé điện tử trong file đính kèm.</p>";
            
            helper.setText(htmlMsg, true);
            helper.addAttachment("Ve_Dien_Tu_" + order.getOrderCode() + ".pdf", new ByteArrayResource(pdfOutputStream.toByteArray()));

            mailSender.send(message);
            log.info("Đã gửi vé điện tử tới email {}", order.getUser().getEmail());
            
        } catch (Exception e) {
            log.error("Gửi email vé điện tử thất bại", e);
        }
    }
}