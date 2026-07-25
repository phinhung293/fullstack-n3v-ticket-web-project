package com.n3v.ticket.services;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.AreaBreakType;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.n3v.ticket.common.TicketQrPayload;
import com.n3v.ticket.entities.ETicket;
import com.n3v.ticket.entities.Event;
import com.n3v.ticket.entities.Order;
import com.n3v.ticket.repositories.ETicketRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;
import org.springframework.util.StringUtils;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private static final DateTimeFormatter EVENT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final JavaMailSender mailSender;
    private final ETicketRepository eTicketRepository;
    private final QrCodeService qrCodeService;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public void sendRegisterOtpEmail(
            String toEmail,
            String fullName,
            String otpCode
    ) {
        sendOtpEmail(
                toEmail,
                fullName,
                otpCode,
                "[N3V Ticket] Mã xác thực đăng ký tài khoản",
                "Mã xác thực đăng ký tài khoản của bạn là: ",
                "OTP đăng ký tài khoản"
        );
    }

    public void sendOtpEmail(
            String toEmail,
            String fullName,
            String otpCode
    ) {
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
            log.warn(
                    "Chưa cấu hình spring.mail.username, "
                            + "chỉ in OTP ra Console."
            );
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
        } catch (MailException exception) {
            log.error(
                    "Gửi email OTP thất bại. OTP vẫn đã được tạo để test. "
                            + "Email: {}, OTP: {}",
                    toEmail,
                    otpCode,
                    exception
            );
        }
    }

    /**
     * Gửi vé bằng một giao dịch đọc mới sau khi giao dịch thanh toán đã commit.
     * Mỗi ETicket là một vé và có một trang PDF với QR riêng.
     */
    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            readOnly = true
    )
    public void sendTicketEmail(Long orderId) {
        if (orderId == null) {
            log.warn("Không thể gửi vé vì orderId null");
            return;
        }

        if (!StringUtils.hasText(mailUsername)) {
            log.warn(
                    "Chưa cấu hình spring.mail.username, "
                            + "không thể gửi email vé cho đơn hàng {}",
                    orderId
            );
            return;
        }

        try {
            List<ETicket> tickets = eTicketRepository
                    .findAllByOrderIdWithEmailDetails(orderId);

            if (tickets.isEmpty()) {
                log.error(
                        "Không gửi email vì đơn hàng {} chưa có vé điện tử",
                        orderId
                );
                return;
            }

            Order order = tickets
                    .get(0)
                    .getOrderItem()
                    .getOrder();

            if (order.getUser() == null
                    || !StringUtils.hasText(order.getUser().getEmail())) {
                log.error(
                        "Không gửi email vì đơn hàng {} không có email người mua",
                        orderId
                );
                return;
            }

            String eventName = resolveEventName(tickets.get(0));
            byte[] pdfContent = createTicketPdf(order, tickets);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    true,
                    "UTF-8"
            );

            helper.setFrom(mailUsername);
            helper.setTo(order.getUser().getEmail());
            helper.setSubject(
                    "[N3V Ticket] Vé điện tử - "
                            + sanitizeSubject(eventName)
            );
            helper.setText(
                    createTicketEmailBody(order, eventName, tickets.size()),
                    true
            );
            helper.addAttachment(
                    "Ve_Dien_Tu_" + order.getOrderCode() + ".pdf",
                    new ByteArrayResource(pdfContent)
            );

            mailSender.send(message);
            log.info(
                    "Đã gửi {} vé điện tử của đơn hàng {} tới email {}",
                    tickets.size(),
                    order.getOrderCode(),
                    order.getUser().getEmail()
            );
        } catch (Exception exception) {
            log.error(
                    "Gửi email vé điện tử cho đơn hàng {} thất bại",
                    orderId,
                    exception
            );
        }
    }

    private byte[] createTicketPdf(
            Order order,
            List<ETicket> tickets
    ) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdfDocument = new PdfDocument(writer);
        Document document = new Document(pdfDocument);

        try {
            for (int index = 0; index < tickets.size(); index++) {
                if (index > 0) {
                    document.add(
                            new AreaBreak(AreaBreakType.NEXT_PAGE)
                    );
                }

                addTicketPage(
                        document,
                        order,
                        tickets.get(index),
                        index + 1,
                        tickets.size()
                );
            }
        } finally {
            document.close();
        }

        return outputStream.toByteArray();
    }

    private void addTicketPage(
            Document document,
            Order order,
            ETicket ticket,
            int ticketNumber,
            int totalTickets
    ) {
        Event event = ticket.getEvent();

        document.add(
                new Paragraph("VE DIEN TU - N3V TICKET")
                        .setBold()
                        .setFontSize(18)
        );
        document.add(
                new Paragraph(
                        "Ve so: " + ticketNumber + "/" + totalTickets
                )
        );
        document.add(
                new Paragraph("Ma ve: " + ticket.getTicketCode())
                        .setBold()
        );
        document.add(
                new Paragraph("Ma don hang: " + order.getOrderCode())
        );
        document.add(
                new Paragraph("Su kien: " + resolveEventName(ticket))
        );
        document.add(
                new Paragraph(
                        "Thoi gian: " + formatEventTime(
                                event != null ? event.getStartTime() : null
                        )
                )
        );
        document.add(
                new Paragraph(
                        "Dia diem: " + valueOrDefault(
                                event != null ? event.getVenueName() : null
                        )
                )
        );
        document.add(
                new Paragraph(
                        "Dia chi: " + valueOrDefault(
                                event != null ? event.getAddress() : null
                        )
                )
        );
        document.add(
                new Paragraph(
                        "Khu vuc: " + valueOrDefault(
                                ticket.getEventZone() != null
                                        ? ticket.getEventZone().getZoneName()
                                        : null
                        )
                )
        );
        document.add(
                new Paragraph(
                        "Ghe/Ban: " + valueOrDefault(
                                ticket.getSeat() != null
                                        ? ticket.getSeat().getSeatCode()
                                        : null
                        )
                )
        );

        byte[] qrImage = qrCodeService.generatePng(
                TicketQrPayload.fromToken(ticket.getQrCodeHash()),
                300,
                300
        );

        Image image = new Image(ImageDataFactory.create(qrImage));
        image.setWidth(220);
        image.setHeight(220);
        image.setHorizontalAlignment(HorizontalAlignment.CENTER);
        document.add(image);

        document.add(
                new Paragraph(
                        "Moi ve chi duoc check-in mot lan. "
                                + "Khong chia se anh QR cho nguoi khac."
                )
        );
    }

    private String createTicketEmailBody(
            Order order,
            String eventName,
            int ticketCount
    ) {
        return "<h3>Cảm ơn bạn đã mua vé tại N3V Ticket!</h3>"
                + "<p>Sự kiện: "
                + HtmlUtils.htmlEscape(eventName)
                + "</p>"
                + "<p>Mã đơn hàng: "
                + HtmlUtils.htmlEscape(order.getOrderCode())
                + "</p>"
                + "<p>Số vé: "
                + ticketCount
                + "</p>"
                + "<p>Mỗi trang trong file PDF đính kèm là một vé "
                + "với mã QR riêng. Vui lòng xuất trình đúng QR khi check-in.</p>"
                + "<p>Không chia sẻ mã QR vé cho người khác.</p>";
    }

    private String resolveEventName(ETicket ticket) {
        return ticket.getEvent() != null
                && StringUtils.hasText(ticket.getEvent().getName())
                ? ticket.getEvent().getName()
                : "Sự kiện N3V";
    }

    private String formatEventTime(LocalDateTime eventTime) {
        return eventTime != null
                ? eventTime.format(EVENT_TIME_FORMATTER)
                : "Chua cap nhat";
    }

    private String valueOrDefault(String value) {
        return StringUtils.hasText(value) ? value : "Khong ap dung";
    }

    private String sanitizeSubject(String value) {
        return value.replace('\r', ' ').replace('\n', ' ');
    }
}
