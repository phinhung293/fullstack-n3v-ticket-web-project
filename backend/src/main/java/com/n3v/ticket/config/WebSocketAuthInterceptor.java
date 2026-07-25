package com.n3v.ticket.config;

import com.n3v.ticket.component.JwtUtils;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtils jwtUtils;

    @Override
    public Message<?> preSend(
            Message<?> message,
            MessageChannel channel
    ) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class
                );

        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();

        if (command == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(command)) {
            authenticateConnect(accessor);
        }

        if ((StompCommand.SUBSCRIBE.equals(command)
                || StompCommand.SEND.equals(command))
                && accessor.getUser() == null) {
            throw new MessagingException(
                    "WebSocket chưa được xác thực"
            );
        }

        return message;
    }

    private void authenticateConnect(
            StompHeaderAccessor accessor
    ) {
        String authorizationHeader =
                accessor.getFirstNativeHeader("Authorization");

        if (authorizationHeader == null
                || !authorizationHeader.startsWith("Bearer ")) {
            throw new MessagingException(
                    "Thiếu JWT trong kết nối WebSocket"
            );
        }

        String token = authorizationHeader.substring(7).trim();

        if (token.isEmpty() || !jwtUtils.isValid(token)) {
            throw new MessagingException(
                    "JWT WebSocket đã hết hạn hoặc không hợp lệ"
            );
        }

        try {
            Claims claims = jwtUtils.extractClaims(token);

            String email = claims.getSubject();
            String role = claims.get("role", String.class);

            if (email == null || email.isBlank()) {
                throw new MessagingException(
                        "JWT không chứa email tài khoản"
                );
            }

            if (role == null || role.isBlank()) {
                throw new MessagingException(
                        "JWT không chứa quyền tài khoản"
                );
            }

            if (!role.startsWith("ROLE_")) {
                role = "ROLE_" + role;
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(new SimpleGrantedAuthority(role))
                    );

            accessor.setUser(authentication);

        } catch (MessagingException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new MessagingException(
                    "Không thể xác thực JWT WebSocket",
                    exception
            );
        }
    }
}