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
}