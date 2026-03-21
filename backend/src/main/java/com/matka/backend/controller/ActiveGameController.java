package com.matka.backend.controller;

import com.matka.backend.ActiveGame;
import com.matka.backend.Game;
import com.matka.backend.repository.ActiveGameRepository;
import com.matka.backend.repository.GameRepository;
import com.matka.backend.service.BetProcessingService;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalTime;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    
    @Autowired
    private BetProcessingService betProcessingService;

    @Autowired
    private com.matka.backend.service.FcmService fcmService;

    private static final Logger log = LoggerFactory.getLogger(ActiveGameController.class);

    @PostMapping("/identify-winners")
    public ResponseEntity<?> identifyWinners(@RequestBody DeclareResultRequest req) {
        if (req == null || req.getGameName() == null || req.getWhen() == null || req.getResult() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing payload (gameName, when, result required)"));
        }

        String gameName = req.getGameName().trim().toUpperCase();
        String when = req.getWhen().trim().toLowerCase();
        Integer result = req.getResult();

        // reuse validation from declareResult
        Optional<Game> gameOpt = gameRepository.findById(gameName);
        if (gameOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Game not found: " + gameName));
        }

        Optional<ActiveGame> activeOpt = activeGameRepository.findById(gameName);
        if (activeOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Active game not configured: " + gameName));
        }

        java.util.List<com.matka.backend.Bet> winners = betProcessingService.findWinningBets(gameName, when.equals("open") ? "Open" : "Close", result);
        // map to simple DTO
        java.util.List<java.util.Map<String,Object>> out = new java.util.ArrayList<>();
        for (com.matka.backend.Bet b : winners) {
            out.add(java.util.Map.of(
                "id", b.getId(),
                "mobileNumber", b.getMobileNumber(),
                "type", b.getType(),
                "amount", b.getAmount(),
                "betValue", b.getBetValue(),
                "openClose", b.getOpenClose(),
                "betTime", b.getBetTime()
            ));
        }

        return ResponseEntity.ok(java.util.Map.of("message", "Predicted winners", "count", out.size(), "winners", out));
    }

    @GetMapping
    public ResponseEntity<List<ActiveGameWithAllowedTypes>> listAll() {
        List<ActiveGame> list = activeGameRepository.findAll();

    java.time.LocalTime now = java.time.LocalTime.now();
    // treat post-midnight window (00:00-02:00) as next-day: no allowed types should be returned
    java.time.LocalTime twoAmWindow = java.time.LocalTime.of(2, 0);

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

            java.util.List<String> allowed;
            java.lang.Boolean runningToday = active.getRunningToday();
            if (runningToday != null && Boolean.FALSE.equals(runningToday)) {
                // not running today -> no allowed types
                allowed = java.util.Collections.emptyList();
            } else {
                // If current time is between 00:00 and 02:00 treat it as next-day and don't allow any types
                if (now.isBefore(twoAmWindow)) {
                    allowed = java.util.Collections.emptyList();
                } else {
                    if (openTime != null && now.isBefore(openTime)) {
                        allowed = java.util.List.of("Open", "Close");
                    } else if (closeTime != null && now.isAfter(closeTime)) {
                        allowed = java.util.Collections.emptyList();
                    } else {
                        allowed = java.util.List.of("Close");
                    }
                }
            }

            ActiveGameWithAllowedTypes dto = new ActiveGameWithAllowedTypes();
            dto.setGameName(active.getGameName());
            dto.setOpenPana(active.getOpenPana());
            dto.setClosePana(active.getClosePana());
            dto.setRunningToday(active.getRunningToday());
            dto.setOpenTime(openTime);
            dto.setCloseTime(closeTime);
            dto.setAllowed_types(allowed);
            out.add(dto);
        }

        return ResponseEntity.ok(out);
    }

    // Start or stop a game running for today. Request body: { "runningToday": true }
    @PostMapping("/{name}/running")
    public ResponseEntity<?> setRunningToday(@PathVariable("name") String name, @RequestBody java.util.Map<String,Object> body) {
        if (name == null || name.isBlank()) return ResponseEntity.badRequest().body(Map.of("message","Missing name"));
        String normalized = name.trim().toUpperCase();
        Optional<ActiveGame> aopt = activeGameRepository.findById(normalized);
        if (aopt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","Active game not found: " + normalized));
        ActiveGame ag = aopt.get();

        Object v = body == null ? null : body.get("runningToday");
        if (v == null) return ResponseEntity.badRequest().body(Map.of("message","runningToday field required"));
        boolean run = false;
        if (v instanceof Boolean) run = (Boolean) v;
        else {
            try { run = Boolean.parseBoolean(String.valueOf(v)); } catch (Exception ex) { return ResponseEntity.badRequest().body(Map.of("message","runningToday must be boolean")); }
        }

        // Fetch game to read open/close times when starting
        Optional<Game> gopt = gameRepository.findById(ag.getGameName());
        java.time.LocalTime now = java.time.LocalTime.now();

        java.util.List<String> allowed;
        if (!run) {
            // stop the game for today: clear allowed types
            ag.setRunningToday(false);
            activeGameRepository.save(ag);
            allowed = java.util.Collections.emptyList();
        } else {
            // start the game for today: compute allowed types based on open/close times
            if (gopt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message","Game not found for active game: " + ag.getGameName()));
            }
            Game g = gopt.get();
            java.time.LocalTime openTime = g.getOpenTime();
            java.time.LocalTime closeTime = g.getCloseTime();

            if (openTime != null && now.isBefore(openTime)) {
                allowed = java.util.List.of("Open", "Close");
            } else if (closeTime != null && now.isAfter(closeTime)) {
                allowed = java.util.Collections.emptyList();
            } else {
                allowed = java.util.List.of("Close");
            }
            ag.setRunningToday(true);
            activeGameRepository.save(ag);
        }

        // Build response DTO
        ActiveGameWithAllowedTypes dto = new ActiveGameWithAllowedTypes();
        dto.setGameName(ag.getGameName());
        dto.setOpenPana(ag.getOpenPana());
        dto.setClosePana(ag.getClosePana());
        dto.setRunningToday(ag.getRunningToday());
        // include times if game present
        if (gopt.isPresent()) {
            dto.setOpenTime(gopt.get().getOpenTime());
            dto.setCloseTime(gopt.get().getCloseTime());
        }
        dto.setAllowed_types(allowed);

        return ResponseEntity.ok(Map.of("message","runningToday updated","activeGame", dto));
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
            // allow declaration in post-midnight window (00:00 - 02:00) as it may be the next day
            java.time.LocalTime twoAm = java.time.LocalTime.of(2,0);
            if (now.isBefore(game.getOpenTime())) {
                if (!now.isBefore(twoAm)) {
                    return ResponseEntity.status(400).body(Map.of("message", "Too early to declare open result. Current time: " + now + ", openTime: " + game.getOpenTime()));
                }
            }
            active.setOpenPana(result);
            activeGameRepository.save(active);
            // after saving the open result, process bets for this game/when
            betProcessingService.processBetsForResult(gameName, "Open", result);
            // send game notification asynchronously (do not block response)
            final DeclareResultRequest dr = req;
            new Thread(() -> {
                try { sendGameNotification(dr); } catch (Exception e) { log.error("sendGameNotification failed: {}", e.getMessage()); }
            }).start();
            return ResponseEntity.ok(Map.of("message", "Open result declared", "activeGame", active));
        } else if (when.equals("close")) {
            if (game.getCloseTime() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Game close time not configured for: " + gameName));
            }
            // allow declaration in post-midnight window (00:00 - 02:00) as it may be the next day
            java.time.LocalTime twoAmClose = java.time.LocalTime.of(2,0);
            if (now.isBefore(game.getCloseTime())) {
                if (!now.isBefore(twoAmClose)) {
                    return ResponseEntity.status(400).body(Map.of("message", "Too early to declare close result. Current time: " + now + ", closeTime: " + game.getCloseTime()));
                }
            }
            active.setClosePana(result);
            activeGameRepository.save(active);
            // after saving the close result, process bets for this game/when
            betProcessingService.processBetsForResult(gameName, "Close", result);
            // send game notification asynchronously (do not block response)
            final DeclareResultRequest dr2 = req;
            new Thread(() -> {
                try { sendGameNotification(dr2); } catch (Exception e) { log.error("sendGameNotification failed: {}", e.getMessage()); }
            }).start();
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
        private Integer openPana;
        private Integer closePana;
    private java.time.LocalTime openTime;
    private java.time.LocalTime closeTime;
    private java.util.List<String> allowed_types;
    private Boolean runningToday;

        public String getGameName() { return gameName; }
        public void setGameName(String gameName) { this.gameName = gameName; }

    @JsonProperty("open_pana")
    public Integer getOpenPana() { return openPana; }
    public void setOpenPana(Integer openPana) { this.openPana = openPana; }

    @JsonProperty("close_pana")
    public Integer getClosePana() { return closePana; }
    public void setClosePana(Integer closePana) { this.closePana = closePana; }

        public java.time.LocalTime getOpenTime() { return openTime; }
        public void setOpenTime(java.time.LocalTime openTime) { this.openTime = openTime; }

        public java.time.LocalTime getCloseTime() { return closeTime; }
        public void setCloseTime(java.time.LocalTime closeTime) { this.closeTime = closeTime; }

        public java.util.List<String> getAllowed_types() { return allowed_types; }
        public void setAllowed_types(java.util.List<String> allowed_types) { this.allowed_types = allowed_types; }
        public Boolean getRunningToday() { return runningToday; }
        public void setRunningToday(Boolean runningToday) { this.runningToday = runningToday; }
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

    // Asynchronously build and send a game notification based on the declared result
    private void sendGameNotification(DeclareResultRequest req) {
        if (req == null) return;
        String gameName = req.getGameName() == null ? "" : req.getGameName().trim().toUpperCase();
        String when = req.getWhen() == null ? "" : req.getWhen().trim().toLowerCase();
        Integer result = req.getResult();

        try {
            String openPanaStr;
            String closePanaStr;
            String openDigitStr;
            String closeDigitStr;

            if ("open".equals(when)) {
                if (result == null) {
                    log.warn("sendGameNotification: open result is null for {}", gameName);
                    return;
                }
                int openPana = result;
                openPanaStr = String.format("%03d", openPana);
                int openDigit = digitOnesPlace(sumDigits(openPanaStr));
                openDigitStr = String.valueOf(openDigit);
                // when open, close pano and digit are masked
                closePanaStr = "***";
                closeDigitStr = "*";
            } else {
                // when == close: fetch active game to obtain open pana
                java.util.Optional<ActiveGame> aopt = activeGameRepository.findById(gameName);
                if (aopt.isEmpty()) {
                    log.warn("sendGameNotification: active game not found for {}", gameName);
                    return;
                }
                ActiveGame ag = aopt.get();

                // fetch open from active game
                Integer openVal = ag.getOpenPana();
                if (openVal == null) {
                    log.warn("sendGameNotification: open pana not available for {} when declaring close", gameName);
                    return;
                }
                openPanaStr = String.format("%03d", openVal);
                openDigitStr = String.valueOf(digitOnesPlace(sumDigits(openPanaStr)));

                if (result == null) {
                    log.warn("sendGameNotification: close result is null for {}", gameName);
                    return;
                }
                int closePana = result;
                closePanaStr = String.format("%03d", closePana);
                closeDigitStr = String.valueOf(digitOnesPlace(sumDigits(closePanaStr)));
            }

            String message = String.format("%s-%s%s-%s", openPanaStr, openDigitStr, closeDigitStr, closePanaStr);

            // Prepare optional data payload
            java.util.Map<String, String> data = new java.util.HashMap<>();
            data.put("gameName", gameName);
            data.put("when", when);
            data.put("openPana", openPanaStr);
            data.put("closePana", closePanaStr);

            // send to game_notifications topic
            String msgId = fcmService.sendToTopic("game_notifications", gameName, message, data);
            if (msgId != null) {
                log.info("Game notification sent for {} when={} messageId={}", gameName, when, msgId);
            } else {
                log.warn("Failed to send game notification for {} when={}", gameName, when);
            }
        } catch (Exception ex) {
            log.error("sendGameNotification exception: {}", ex.getMessage());
        }
    }

    private int sumDigits(String threeDigit) {
        int sum = 0;
        for (char c : threeDigit.toCharArray()) {
            if (Character.isDigit(c)) sum += (c - '0');
        }
        return sum;
    }

    private int digitOnesPlace(int sum) {
        return Math.abs(sum) % 10;
    }
}
    