package com.matka.backend.controller;

import com.matka.backend.Game;
import com.matka.backend.repository.GameRepository;
import com.matka.backend.repository.BetRepository;
import com.matka.backend.ActiveGame;
import com.matka.backend.repository.ActiveGameRepository;
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
    @Autowired
    private ActiveGameRepository activeGameRepository;
    @Autowired
    private BetRepository betRepository;


    // Create or update a game. Normalize name to upper-case to avoid duplicates.
    @PostMapping
    public ResponseEntity<?> createOrUpdate(@RequestBody Game game) {
        if (game == null || game.getName() == null) {
            return ResponseEntity.badRequest().body("Missing game payload or name");
        }
        // normalize name
        String normalized = game.getName().trim().toUpperCase();

    // Detect whether this will be a new game (create) or an update
    boolean isNew = !gameRepository.existsById(normalized);
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
        // Set weekend flags if provided
        if (game.getSaturday() != null) {
            entity.setSaturday(game.getSaturday());
        }
        if (game.getSunday() != null) {
            entity.setSunday(game.getSunday());
        }
        // set enabled flag: if provided use it, else default to true for new games
        if (game.getEnabled() != null) {
            entity.setEnabled(game.getEnabled());
        } else if (isNew) {
            entity.setEnabled(true);
        }

        Game saved = gameRepository.save(entity);
        // If this was a new Game, ensure there is a corresponding ActiveGame entry
        if (isNew) {
            try {
                // Do not create ActiveGame rows for games that are disabled
                if (Boolean.FALSE.equals(saved.getEnabled())) {
                    log.info("New game '{}' is disabled; skipping creation of ActiveGame entry", saved.getName());
                } else {
                    if (!activeGameRepository.existsById(saved.getName())) {
                        ActiveGame ag = new ActiveGame();
                        ag.setGameName(saved.getName());
                        ag.setOpenPana(null);
                        ag.setClosePana(null);
                        // determine runningToday based on current day and game's flags
                        java.time.DayOfWeek dow = java.time.LocalDate.now().getDayOfWeek();
                        boolean isSat = dow == java.time.DayOfWeek.SATURDAY;
                        boolean isSun = dow == java.time.DayOfWeek.SUNDAY;
                        if (isSat) {
                            ag.setRunningToday(Boolean.TRUE.equals(saved.getSaturday()));
                        } else if (isSun) {
                            ag.setRunningToday(Boolean.TRUE.equals(saved.getSunday()));
                        } else {
                            ag.setRunningToday(true);
                        }
                        activeGameRepository.save(ag);
                        log.info("Created ActiveGame entry for new game {} (runningToday={})", saved.getName(), ag.getRunningToday());
                    }
                }
            } catch (Exception ex) {
                log.error("Failed to create ActiveGame for game {}", saved.getName(), ex);
            }
        }
        log.info("Saved game name={} openTime={} closeTime={} saturday={} sunday={}", saved.getName(), saved.getOpenTime(), saved.getCloseTime(), saved.getSaturday(), saved.getSunday());
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
        // only return enabled games
        List<Game> list = gameRepository.findAll();
        List<Game> out = new java.util.ArrayList<>();
        if (list != null) {
            for (Game g : list) {
                if (g == null) continue;
                if (Boolean.TRUE.equals(g.getEnabled())) out.add(g);
            }
        }
        return ResponseEntity.ok(out);
    }

    // List disabled games
    @GetMapping("/disabled")
    public ResponseEntity<List<Game>> listDisabled() {
        List<Game> list = gameRepository.findAll();
        List<Game> out = new java.util.ArrayList<>();
        if (list != null) {
            for (Game g : list) {
                if (g == null) continue;
                if (Boolean.FALSE.equals(g.getEnabled())) out.add(g);
            }
        }
        return ResponseEntity.ok(out);
    }

    // Enable/disable a game by name. Request body: { "enabled": true }
    @PostMapping("/{name}/enable")
    public ResponseEntity<?> setEnabled(@PathVariable("name") String name, @RequestBody java.util.Map<String, Object> body) {
        if (name == null || name.isBlank()) return ResponseEntity.badRequest().body("Missing name");
        String normalized = name.trim().toUpperCase();
        Optional<Game> gopt = gameRepository.findById(normalized);
        if (gopt.isEmpty()) return ResponseEntity.status(404).body("Game not found");
        Game g = gopt.get();
        Object v = body == null ? null : body.get("enabled");
        if (v == null) return ResponseEntity.badRequest().body(Map.of("message","enabled field required"));
        boolean en = false;
        if (v instanceof Boolean) en = (Boolean) v;
        else {
            try { en = Boolean.parseBoolean(String.valueOf(v)); } catch (Exception ex) { return ResponseEntity.badRequest().body(Map.of("message","enabled must be boolean")); }
        }
        g.setEnabled(en);
        gameRepository.save(g);
        // If game was disabled, remove it from active_games and delete any pending bets for that game
        if (!en) {
            try {
                if (activeGameRepository.existsById(normalized)) {
                    activeGameRepository.deleteById(normalized);
                    log.info("Deleted ActiveGame entry for disabled game {}", normalized);
                }
            } catch (Exception ex) {
                log.error("Error deleting ActiveGame for disabled game {}", normalized, ex);
            }

            try {
                java.util.List<com.matka.backend.Bet> bets = betRepository.findByGameName(normalized);
                if (bets != null && !bets.isEmpty()) {
                    betRepository.deleteAll(bets);
                    log.info("Deleted {} bets for disabled game {}", bets.size(), normalized);
                }
            } catch (Exception ex) {
                log.error("Error deleting bets for disabled game {}", normalized, ex);
            }
        }
        return ResponseEntity.ok(Map.of("message","Game updated","name",g.getName(),"enabled",g.getEnabled()));
    }
}
