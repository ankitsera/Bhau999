package com.matka.backend.repository;

import com.matka.backend.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // derived delete method
    void deleteByDatetimeBefore(LocalDateTime cutoff);
}
