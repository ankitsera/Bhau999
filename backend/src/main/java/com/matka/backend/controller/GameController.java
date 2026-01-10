package com.matka.backend.controller;

import com.matka.backend.Game;
import com.matka.backend.repository.GameRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/game")
public class GameController {
    private static final Logger log = LoggerFactory.getLogger(GameController.class);

    @Autowired
    private GameRepository gameRepository;


    // Create or update a game. Normalize name to upper-case to avoid duplicates.
    @PostMapping
    public ResponseEntity<?> createOrUpdate(@RequestBody Game game) {
        if (game == null || game.getName() == null) {
            return ResponseEntity.badRequest().body("Missing game payload or name");
        }
        // normalize name
        String normalized = game.getName().trim().toUpperCase();

        // Load existing or create new so updates don't wipe other fields unintentionally
        Game entity = gameRepository.findById(normalized).orElseGet(() -> new Game());
        entity.setName(normalized);

        // Set open/close times from incoming object if provided (same approach as name)
        if (game.getOpenTime() != null) {
            entity.setOpenTime(game.getOpenTime());
        }
        if (game.getCloseTime() != null) {
            entity.setCloseTime(game.getCloseTime());
        }

        Game saved = gameRepository.save(entity);
        log.info("Saved game name={} openTime={} closeTime={}", saved.getName(), saved.getOpenTime(), saved.getCloseTime());
        return ResponseEntity.ok(saved);
    }

    // Delete a game by name (name is primary key)
    @DeleteMapping("/{name}")
    public ResponseEntity<?> delete(@PathVariable("name") String name) {
        String normalized = name == null ? null : name.trim().toUpperCase();
        if (normalized == null) return ResponseEntity.badRequest().body("Missing name");
        Optional<Game> g = gameRepository.findById(normalized);
        if (g.isEmpty()) {
            return ResponseEntity.status(404).body("Game not found");
        }
        gameRepository.deleteById(normalized);
        log.info("Deleted game name={}", normalized);
        return ResponseEntity.ok(Map.of("deleted", normalized));
    }

    // List all games
    @GetMapping
    public ResponseEntity<List<Game>> listAll() {
        List<Game> list = gameRepository.findAll();
        return ResponseEntity.ok(list);
    }
}
