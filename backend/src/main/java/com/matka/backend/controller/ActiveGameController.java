package com.matka.backend.controller;

import com.matka.backend.ActiveGame;
import com.matka.backend.Game;
import com.matka.backend.repository.ActiveGameRepository;
import com.matka.backend.repository.GameRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Optional;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/active-games")
public class ActiveGameController {

    @Autowired
    private ActiveGameRepository activeGameRepository;

    @Autowired
    private GameRepository gameRepository;

    @GetMapping
    public ResponseEntity<List<ActiveGameWithAllowedTypes>> listAll() {
        List<ActiveGame> list = activeGameRepository.findAll();

        java.time.LocalTime now = java.time.LocalTime.now();

        List<ActiveGameWithAllowedTypes> out = new java.util.ArrayList<>();
        for (ActiveGame active : list) {
            // try to fetch game times; fallback to null if not present
            java.time.LocalTime openTime = null;
            java.time.LocalTime closeTime = null;
            try {
                java.util.Optional<Game> gopt = gameRepository.findById(active.getGameName());
                if (gopt.isPresent()) {
                    Game g = gopt.get();
                    openTime = g.getOpenTime();
                    closeTime = g.getCloseTime();
                }
            } catch (Exception e) {
                // ignore and treat times as null
            }

            String allowed;
            if (openTime != null && now.isBefore(openTime)) {
                allowed = "Open, Close";
            } else if (closeTime != null && now.isAfter(closeTime)) {
                allowed = null;
            } else {
                allowed = "Close";
            }

            ActiveGameWithAllowedTypes dto = new ActiveGameWithAllowedTypes();
            dto.setGameName(active.getGameName());
            dto.setOpen(active.getOpen());
            dto.setClose(active.getClose());
            dto.setOpenTime(openTime);
            dto.setCloseTime(closeTime);
            dto.setAllowed_types(allowed);
            out.add(dto);
        }

        return ResponseEntity.ok(out);
    }

    /**
     * Declare result for a game. Request JSON: { "gameName": "NAME", "when": "open"|"close", "result": 5 }
     * - checks that current time >= game's openTime/closeTime before allowing declare
     * - updates the corresponding field in active_games (open or close)
     */
    @PostMapping("/declare-result")
    @Transactional
    public ResponseEntity<?> declareResult(@RequestBody DeclareResultRequest req) {
        if (req == null || req.getGameName() == null || req.getWhen() == null || req.getResult() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing payload (gameName, when, result required)"));
        }

        String gameName = req.getGameName().trim().toUpperCase();
        String when = req.getWhen().trim().toLowerCase();
        Integer result = req.getResult();

        Optional<Game> gameOpt = gameRepository.findById(gameName);
        if (gameOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Game not found: " + gameName));
        }

        Game game = gameOpt.get();

        Optional<ActiveGame> activeOpt = activeGameRepository.findById(gameName);
        if (activeOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Active game not configured: " + gameName));
        }

        ActiveGame active = activeOpt.get();

        LocalTime now = LocalTime.now();

        if (when.equals("open")) {
            if (game.getOpenTime() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Game open time not configured for: " + gameName));
            }
            if (now.isBefore(game.getOpenTime())) {
                return ResponseEntity.status(400).body(Map.of("message", "Too early to declare open result. Current time: " + now + ", openTime: " + game.getOpenTime()));
            }
            active.setOpen(result);
            activeGameRepository.save(active);
            return ResponseEntity.ok(Map.of("message", "Open result declared", "activeGame", active));
        } else if (when.equals("close")) {
            if (game.getCloseTime() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Game close time not configured for: " + gameName));
            }
            if (now.isBefore(game.getCloseTime())) {
                return ResponseEntity.status(400).body(Map.of("message", "Too early to declare close result. Current time: " + now + ", closeTime: " + game.getCloseTime()));
            }
            active.setClose(result);
            activeGameRepository.save(active);
            return ResponseEntity.ok(Map.of("message", "Close result declared", "activeGame", active));
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid 'when' value; expected 'open' or 'close'"));
        }
    }

    /**
     * DTO returned by GET /api/active-games with an additional allowed_types field
     */
    public static class ActiveGameWithAllowedTypes {
        private String gameName;
        private Integer open;
        private Integer close;
        private java.time.LocalTime openTime;
        private java.time.LocalTime closeTime;
        private String allowed_types;

        public String getGameName() { return gameName; }
        public void setGameName(String gameName) { this.gameName = gameName; }

        public Integer getOpen() { return open; }
        public void setOpen(Integer open) { this.open = open; }

        public Integer getClose() { return close; }
        public void setClose(Integer close) { this.close = close; }

        public java.time.LocalTime getOpenTime() { return openTime; }
        public void setOpenTime(java.time.LocalTime openTime) { this.openTime = openTime; }

        public java.time.LocalTime getCloseTime() { return closeTime; }
        public void setCloseTime(java.time.LocalTime closeTime) { this.closeTime = closeTime; }

        public String getAllowed_types() { return allowed_types; }
        public void setAllowed_types(String allowed_types) { this.allowed_types = allowed_types; }
    }

    public static class DeclareResultRequest {
        private String gameName;
        private String when;
        private Integer result;

        public String getGameName() { return gameName; }
        public void setGameName(String gameName) { this.gameName = gameName; }
        public String getWhen() { return when; }
        public void setWhen(String when) { this.when = when; }
        public Integer getResult() { return result; }
        public void setResult(Integer result) { this.result = result; }
    }
}
