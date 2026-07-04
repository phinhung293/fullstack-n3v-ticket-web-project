package com.n3v.ticket.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    public void sendOtpEmail(String toEmail, String fullName, String otpCode) {
        /*
         * Luôn in OTP ra Console để test.
         * Nếu Gmail gửi lỗi thì frontend vẫn đi tiếp bước nhập mã.
         */
        log.warn("OTP đặt lại mật khẩu cho email {} là: {}", toEmail, otpCode);

        if (!StringUtils.hasText(mailUsername)) {
            log.warn("Chưa cấu hình spring.mail.username, chỉ in OTP ra Console.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(mailUsername);
            message.setTo(toEmail);
            message.setSubject("[N3V Ticket] Mã xác minh đặt lại mật khẩu");
            message.setText(
                    "Chào " + fullName + ",\n\n"
                            + "Mã xác minh đặt lại mật khẩu của bạn là: " + otpCode + "\n"
                            + "Mã có hiệu lực trong 5 phút.\n\n"
                            + "Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\n"
                            + "N3V Ticket"
            );

            mailSender.send(message);
            log.info("Đã gửi OTP đặt lại mật khẩu tới email {}", toEmail);
        } catch (MailException ex) {
            log.error("Gửi email OTP thất bại. OTP vẫn đã được tạo để test. Email: {}, OTP: {}", toEmail, otpCode, ex);
        }
    }
}