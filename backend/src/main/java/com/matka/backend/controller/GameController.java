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
        game.setName(normalized);
        Game saved = gameRepository.save(game);
        log.info("Saved game name={}", saved.getName());
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
