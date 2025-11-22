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
    public ResponseEntity<List<ActiveGame>> listAll() {
        List<ActiveGame> list = activeGameRepository.findAll();
        return ResponseEntity.ok(list);
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
