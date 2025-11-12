package com.matka.backend.controller;

import com.matka.backend.GameHistory;
import com.matka.backend.repository.GameHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game-history")
public class GameHistoryController {

    @Autowired
    private GameHistoryRepository gameHistoryRepository;

    @GetMapping
    public ResponseEntity<List<GameHistory>> listAll() {
        List<GameHistory> list = gameHistoryRepository.findAll();
        return ResponseEntity.ok(list);
    }
}
