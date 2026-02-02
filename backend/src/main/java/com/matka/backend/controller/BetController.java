package com.matka.backend.controller;

import com.matka.backend.Bet;
import com.matka.backend.Game;
import com.matka.backend.repository.BetRepository;
import com.matka.backend.repository.UserRepository;
import com.matka.backend.repository.GameRepository;
import com.matka.backend.repository.RateRepository;
import com.matka.backend.repository.TransactionRepository;
import com.matka.backend.TransactionEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.util.ArrayList;

@RestController
@RequestMapping("/api")
public class BetController {
    private static final Logger log = LoggerFactory.getLogger(BetController.class);

    // Lightweight DTO used only for JSON responses to avoid triggering lazy loads
    private static class BetResponse {
        public Long id;
        public String mobileNumber;
        public String gameName;
        public String type;
        public Integer amount;
        public Integer winAmount;
            public String betValue;
        public String openClose;
        public java.time.LocalDateTime betTime;
        public String result;

        public BetResponse() {}
        public BetResponse(Bet b) {
            if (b == null) return;
            this.id = b.getId();
            this.mobileNumber = b.getMobileNumber();
            this.gameName = b.getGameName();
            this.type = b.getType();
            this.amount = b.getAmount();
            this.winAmount = b.getWinAmount();
            this.betValue = b.getBetValue();
            this.openClose = b.getOpenClose();
            this.betTime = b.getBetTime();
            this.result = b.getResult();
        }
        public BetResponse(com.matka.backend.BetHistory b) {
            if (b == null) return;
            this.id = b.getId();
            this.mobileNumber = b.getMobileNumber();
            this.gameName = b.getGameName();
            this.type = b.getType();
            this.amount = b.getAmount();
            this.winAmount = b.getWinAmount();
            this.betValue = b.getBetValue();
            this.openClose = b.getOpenClose();
            this.betTime = b.getBetTime();
            this.result = b.getResult();
        }
    }

    @Autowired
    private BetRepository betRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private RateRepository rateRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private com.matka.backend.repository.BetHistoryRepository betHistoryRepository;

    // POST /api/bet  -> create one or many bets (accepts a JSON array of bets)
    @PostMapping("/bet")
    @Transactional
    public ResponseEntity<?> create(@RequestBody java.util.List<Bet> bets) {
        if (bets == null || bets.isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Request must contain a non-empty array of bets"));
        }

        java.util.List<Bet> savedBets = new java.util.ArrayList<>();

        for (Bet bet : bets) {
            if (bet == null || bet.getMobileNumber() == null || bet.getGameName() == null || bet.getType() == null || bet.getAmount() == null || bet.getBetValue() == null || bet.getBetValue().isBlank()) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Missing bet payload or required fields (mobileNumber, gameName, type, amount, betValue)"));
            }

            // normalize game name
            String normalizedGame = bet.getGameName().trim().toUpperCase();
            bet.setGameName(normalizedGame);

            // validate user
            var userOpt = userRepository.findByMobileNumber(bet.getMobileNumber());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(404).body(java.util.Map.of("message", "User not found for mobile: " + bet.getMobileNumber()));
            }

            // validate game
            Optional<Game> gameOpt = gameRepository.findById(normalizedGame);
            if (gameOpt.isEmpty()) {
                return ResponseEntity.status(404).body(java.util.Map.of("message", "Game not found: " + normalizedGame));
            }

            // validate rate/type
            if (rateRepository.findById(bet.getType()).isEmpty()) {
                return ResponseEntity.status(404).body(java.util.Map.of("message", "Rate/type not found: " + bet.getType()));
            }

            // enforce time-based acceptance rules:
            // - if current time is after game's openTime, do not accept "Open" bets
            // - if current time is after game's closeTime, do not accept any bets
            Game game = gameOpt.get();
            java.time.LocalTime now = java.time.LocalTime.now();
            java.time.LocalTime openTime = game.getOpenTime();
            java.time.LocalTime closeTime = game.getCloseTime();
            String openClose = bet.getOpenClose();
            if (closeTime != null && now.isAfter(closeTime)) {
                return ResponseEntity.status(400).body(java.util.Map.of("message", "Betting closed for game: " + normalizedGame + " (after closeTime)"));
            }
            if (openTime != null && openClose != null && "open".equalsIgnoreCase(openClose) && now.isAfter(openTime)) {
                return ResponseEntity.status(400).body(java.util.Map.of("message", "Too late to place 'Open' bets for game: " + normalizedGame + " (after openTime)"));
            }

            // deduct amount from user balance
            var user = userOpt.get();
            Integer current = user.getBalance() == null ? 0 : user.getBalance();
            if (current < bet.getAmount()) {
                return ResponseEntity.status(400).body(java.util.Map.of("message", "Insufficient balance for mobile: " + bet.getMobileNumber()));
            }
            int newBalance = current - bet.getAmount();
            user.setBalance(newBalance);
            userRepository.save(user);

            // set bet time to current datetime
            bet.setBetTime(LocalDateTime.now());
            // initialize win amount
            bet.setWinAmount(0);

            // record transaction for the bet (negative amount)
            TransactionEntity tx = new TransactionEntity();
            tx.setMobileNumber(bet.getMobileNumber());
            tx.setAmount(-Math.abs(bet.getAmount()));
            tx.setTxDate(LocalDate.now());
            tx.setTxTime(java.time.LocalTime.now());
            // mark who initiated this transaction
            tx.setInitiator("Bet placed");
            transactionRepository.save(tx);

            Bet saved = betRepository.save(bet);
            log.info("Saved bet id={} mobile={} game={} type={} amount={} betValue={} newBalance={}", saved.getId(), saved.getMobileNumber(), saved.getGameName(), saved.getType(), saved.getAmount(), saved.getBetValue(), newBalance);
            savedBets.add(saved);
        }

        return ResponseEntity.ok(java.util.Map.of("message", "Bets placed", "bets", savedBets));
    }

    // List all bets
    // GET /api/bets -> return all bets (mapped to DTO to avoid lazy fetches)
    @GetMapping("/bets")
    public ResponseEntity<java.util.List<BetResponse>> listAll() {
        java.util.List<Bet> list = betRepository.findAll();
        java.util.List<BetResponse> out = new java.util.ArrayList<>();
        if (list != null) for (Bet b : list) out.add(new BetResponse(b));
        return ResponseEntity.ok(out);
    }

    // Move of BetHistory list endpoint: GET /api/bet-history
    @GetMapping("/bet-history")
    public ResponseEntity<java.util.List<BetResponse>> listHistory() {
        java.util.List<com.matka.backend.BetHistory> list = betHistoryRepository.findAll();
        java.util.List<BetResponse> out = new java.util.ArrayList<>();
        if (list != null) for (com.matka.backend.BetHistory b : list) out.add(new BetResponse(b));
        return ResponseEntity.ok(out);
    }

    // GET /api/bets/user/{mobileNumber} -> fetch bets for a user from both bets and bets_history
    // Optional request param: date=yyyy-MM-dd to filter by betTime date
    @GetMapping("/bets/user/{mobileNumber}")
    public ResponseEntity<?> listByUser(@PathVariable String mobileNumber, @RequestParam(name = "date", required = false) String dateStr) {
        if (mobileNumber == null || mobileNumber.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("sum", 0L, "bets", new ArrayList<>()));
        }

        java.time.LocalDate filterDate = null;
        if (dateStr != null && !dateStr.isBlank()) {
            try {
                filterDate = java.time.LocalDate.parse(dateStr.trim());
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid date format; expected yyyy-MM-dd"));
            }
        }

        List<BetResponse> combined = new ArrayList<>();
        long sum = 0L;

        List<Bet> fromBets = betRepository.findByMobileNumber(mobileNumber);
        List<com.matka.backend.BetHistory> fromHistory = betHistoryRepository.findByMobileNumber(mobileNumber);

        if (fromBets != null) {
            for (Bet b : fromBets) {
                if (b == null) continue;
                if (filterDate != null) {
                    if (b.getBetTime() == null) continue;
                    if (!filterDate.equals(b.getBetTime().toLocalDate())) continue;
                }
                combined.add(new BetResponse(b));
                if (b.getWinAmount() != null) sum += (long) b.getWinAmount();
            }
        }

        if (fromHistory != null) {
            for (com.matka.backend.BetHistory b : fromHistory) {
                if (b == null) continue;
                if (filterDate != null) {
                    if (b.getBetTime() == null) continue;
                    if (!filterDate.equals(b.getBetTime().toLocalDate())) continue;
                }
                combined.add(new BetResponse(b));
                if (b.getWinAmount() != null) sum += (long) b.getWinAmount();
            }
        }

        return ResponseEntity.ok(java.util.Map.of("sum", sum, "bets", combined));
    }

    // GET /api/bets/game/{gameName}/all -> fetch bets for a game from both bets and bets_history
    @GetMapping("/bets/game/{gameName}/all")
    public ResponseEntity<List<BetResponse>> listByGameAll(@PathVariable String gameName) {
        if (gameName == null || gameName.isBlank()) {
            return ResponseEntity.badRequest().body(new ArrayList<>());
        }
        String normalized = gameName.trim().toUpperCase();
        List<Bet> fromBets = betRepository.findByGameName(normalized);
        List<com.matka.backend.BetHistory> fromHistory = betHistoryRepository.findByGameName(normalized);
        List<BetResponse> combined = new ArrayList<>();
        if (fromBets != null) for (Bet b : fromBets) combined.add(new BetResponse(b));
        if (fromHistory != null) for (com.matka.backend.BetHistory b : fromHistory) combined.add(new BetResponse(b));
        return ResponseEntity.ok(combined);
    }

    // GET /api/bets/game/{gameName} -> fetch bets for a game from bets only
    @GetMapping("/bets/game/{gameName}")
    public ResponseEntity<List<BetResponse>> listByGame(@PathVariable String gameName) {
        if (gameName == null || gameName.isBlank()) {
            return ResponseEntity.badRequest().body(new ArrayList<>());
        }
        String normalized = gameName.trim().toUpperCase();
        List<Bet> fromBets = betRepository.findByGameName(normalized);
        List<BetResponse> out = new ArrayList<>();
        if (fromBets != null) for (Bet b : fromBets) out.add(new BetResponse(b));
        return ResponseEntity.ok(out);
    }

    // POST /api/bets/won -> returns list of bets with result='Won' from both bets and bets_history and the sum of amounts
    // Request body: { "mobileNumber": "...", "date": "yyyy-MM-dd" } — both fields optional
    @PostMapping("/bets/won")
    public ResponseEntity<?> listWonBets(@RequestBody WonBetsRequest req) {
        String mobile = req == null ? null : req.getMobileNumber();
        String dateStr = req == null ? null : req.getDate();
        java.time.LocalDate filterDate = null;
        if (dateStr != null && !dateStr.isBlank()) {
            try {
                filterDate = java.time.LocalDate.parse(dateStr.trim());
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid date format; expected yyyy-MM-dd"));
            }
        }

        java.util.List<BetResponse> out = new java.util.ArrayList<>();
        long sum = 0L;

        // fetch from active bets
        java.util.List<Bet> fromBets;
        if (mobile != null && !mobile.isBlank()) {
            fromBets = betRepository.findByMobileNumber(mobile.trim());
        } else {
            fromBets = betRepository.findAll();
        }

        if (fromBets != null) {
            for (Bet b : fromBets) {
                try {
                    if (b == null) continue;
                    if (b.getResult() == null) continue;
                    if (!"won".equalsIgnoreCase(b.getResult())) continue;
                    if (filterDate != null) {
                        if (b.getBetTime() == null) continue;
                        if (!filterDate.equals(b.getBetTime().toLocalDate())) continue;
                    }
                    out.add(new BetResponse(b));
                    if (b.getWinAmount() != null) sum += (long) b.getWinAmount();
                } catch (Exception ex) {
                    log.warn("Error processing bet id {}", b == null ? null : b.getId(), ex);
                }
            }
        }

        // fetch from history
        java.util.List<com.matka.backend.BetHistory> fromHistory;
        if (mobile != null && !mobile.isBlank()) {
            fromHistory = betHistoryRepository.findByMobileNumber(mobile.trim());
        } else {
            fromHistory = betHistoryRepository.findAll();
        }

        if (fromHistory != null) {
            for (com.matka.backend.BetHistory b : fromHistory) {
                try {
                    if (b == null) continue;
                    if (b.getResult() == null) continue;
                    if (!"won".equalsIgnoreCase(b.getResult())) continue;
                    if (filterDate != null) {
                        if (b.getBetTime() == null) continue;
                        if (!filterDate.equals(b.getBetTime().toLocalDate())) continue;
                    }
                    out.add(new BetResponse(b));
                    if (b.getWinAmount() != null) sum += (long) b.getWinAmount();
                } catch (Exception ex) {
                    log.warn("Error processing betHistory id {}", b == null ? null : b.getId(), ex);
                }
            }
        }

        return ResponseEntity.ok(java.util.Map.of("sum", sum, "bets", out));
    }

    public static class WonBetsRequest {
        private String mobileNumber;
        private String date;

        public String getMobileNumber() { return mobileNumber; }
        public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
    }

    // POST /api/bets/all -> returns list of bets from bets and bets_history and sum of amount
    // Request body: { "mobileNumber": "...", "date": "yyyy-MM-dd" } — both optional
    @PostMapping("/bets/all")
    public ResponseEntity<?> listAllBets(@RequestBody WonBetsRequest req) {
        String mobile = req == null ? null : req.getMobileNumber();
        String dateStr = req == null ? null : req.getDate();
        java.time.LocalDate filterDate = null;
        if (dateStr != null && !dateStr.isBlank()) {
            try {
                filterDate = java.time.LocalDate.parse(dateStr.trim());
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(java.util.Map.of("message", "Invalid date format; expected yyyy-MM-dd"));
            }
        }

        java.util.List<BetResponse> out = new java.util.ArrayList<>();
        long sum = 0L;

        // fetch from active bets
        java.util.List<Bet> fromBets;
        if (mobile != null && !mobile.isBlank()) {
            fromBets = betRepository.findByMobileNumber(mobile.trim());
        } else {
            fromBets = betRepository.findAll();
        }

        if (fromBets != null) {
            for (Bet b : fromBets) {
                try {
                    if (b == null) continue;
                    if (filterDate != null) {
                        if (b.getBetTime() == null) continue;
                        if (!filterDate.equals(b.getBetTime().toLocalDate())) continue;
                    }
                    out.add(new BetResponse(b));
                    if (b.getAmount() != null) sum += (long) b.getAmount();
                } catch (Exception ex) {
                    log.warn("Error processing bet id {}", b == null ? null : b.getId(), ex);
                }
            }
        }

        // fetch from history
        java.util.List<com.matka.backend.BetHistory> fromHistory;
        if (mobile != null && !mobile.isBlank()) {
            fromHistory = betHistoryRepository.findByMobileNumber(mobile.trim());
        } else {
            fromHistory = betHistoryRepository.findAll();
        }

        if (fromHistory != null) {
            for (com.matka.backend.BetHistory b : fromHistory) {
                try {
                    if (b == null) continue;
                    if (filterDate != null) {
                        if (b.getBetTime() == null) continue;
                        if (!filterDate.equals(b.getBetTime().toLocalDate())) continue;
                    }
                    out.add(new BetResponse(b));
                    if (b.getAmount() != null) sum += (long) b.getAmount();
                } catch (Exception ex) {
                    log.warn("Error processing betHistory id {}", b == null ? null : b.getId(), ex);
                }
            }
        }

        return ResponseEntity.ok(java.util.Map.of("sum", sum, "bets", out));
    }
}
