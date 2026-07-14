package com.n3v.ticket.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.payos.PayOS;

@Configuration
public class PayOSConfig {

    @Value("${payos.client-id:default-client-id}")
    private String clientId;

    @Value("${payos.api-key:default-api-key}")
    private String apiKey;

    @Value("${payos.checksum-key:default-checksum-key}")
    private String checksumKey;

    @Bean
    public PayOS payOS() {
        return new PayOS(clientId, apiKey, checksumKey);
    }
}
