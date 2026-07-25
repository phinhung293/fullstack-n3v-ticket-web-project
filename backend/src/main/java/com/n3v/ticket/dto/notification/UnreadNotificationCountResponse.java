package com.n3v.ticket.dto.notification;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UnreadNotificationCountResponse {

    private long unreadCount;
}