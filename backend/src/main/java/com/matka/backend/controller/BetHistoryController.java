package com.matka.backend.controller;

import com.matka.backend.BetHistory;
import com.matka.backend.repository.BetHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bet-history")
public class BetHistoryController {

    @Autowired
    private BetHistoryRepository betHistoryRepository;

    @GetMapping
    public ResponseEntity<List<BetHistory>> listAll() {
        List<BetHistory> list = betHistoryRepository.findAll();
        return ResponseEntity.ok(list);
    }
}
