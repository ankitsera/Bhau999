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
    public ResponseEntity<List<GameHistoryResponse>> listAll() {
        List<GameHistory> list = gameHistoryRepository.findAll();
        List<GameHistoryResponse> out = new java.util.ArrayList<>();
        if (list != null) {
            for (GameHistory gh : list) {
                if (gh == null) continue;
                GameHistoryResponse r = new GameHistoryResponse();
                r.setId(gh.getId());
                r.setGameName(gh.getGameName());
                r.setHistDate(gh.getHistDate());
                r.setOpenPana(gh.getOpenPana());
                r.setClosePana(gh.getClosePana());
                out.add(r);
            }
        }
        return ResponseEntity.ok(out);
    }

    // DTO to avoid lazy-loading Game relation when serializing
    public static class GameHistoryResponse {
        private Long id;
        private String gameName;
        private java.time.LocalDate histDate;
        private Integer openPana;
        private Integer closePana;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getGameName() { return gameName; }
        public void setGameName(String gameName) { this.gameName = gameName; }

        public java.time.LocalDate getHistDate() { return histDate; }
        public void setHistDate(java.time.LocalDate histDate) { this.histDate = histDate; }

        public Integer getOpenPana() { return openPana; }
        public void setOpenPana(Integer openPana) { this.openPana = openPana; }

        public Integer getClosePana() { return closePana; }
        public void setClosePana(Integer closePana) { this.closePana = closePana; }
    }
}
