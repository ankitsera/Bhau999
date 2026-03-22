package com.matka.backend.controller;

import com.matka.backend.Notification;
import com.matka.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    // Return all notifications sorted by datetime descending (newest first)
    @GetMapping
    public ResponseEntity<?> listAll() {
        List<Notification> all = notificationRepository.findAll(Sort.by(Sort.Direction.DESC, "datetime"));
        return ResponseEntity.ok(all);
    }
}
