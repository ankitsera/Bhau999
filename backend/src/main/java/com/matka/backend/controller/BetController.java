package com.matka.backend.controller;

import com.matka.backend.Bet;
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
import java.util.Optional;

@RestController
@RequestMapping("/api/bet")
public class BetController {
    private static final Logger log = LoggerFactory.getLogger(BetController.class);

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

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody Bet bet) {
        if (bet == null || bet.getMobileNumber() == null || bet.getGameName() == null || bet.getType() == null || bet.getAmount() == null) {
            return ResponseEntity.badRequest().body("Missing bet payload or required fields (mobileNumber, gameName, type, amount)");
        }

        // normalize game name
        String normalizedGame = bet.getGameName().trim().toUpperCase();
        bet.setGameName(normalizedGame);

        // validate user
        var userOpt = userRepository.findByMobileNumber(bet.getMobileNumber());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found for mobile: " + bet.getMobileNumber());
        }

        // validate game
        if (gameRepository.findById(normalizedGame).isEmpty()) {
            return ResponseEntity.status(404).body("Game not found: " + normalizedGame);
        }

        // validate rate/type
        if (rateRepository.findById(bet.getType()).isEmpty()) {
            return ResponseEntity.status(404).body("Rate/type not found: " + bet.getType());
        }

        // set bet date if missing
        if (bet.getBetDate() == null) bet.setBetDate(LocalDate.now());

        // deduct amount from user balance
        var user = userOpt.get();
        Integer current = user.getBalance() == null ? 0 : user.getBalance();
        if (current < bet.getAmount()) {
            return ResponseEntity.status(400).body("Insufficient balance");
        }
        int newBalance = current - bet.getAmount();
        user.setBalance(newBalance);
        userRepository.save(user);

        // record transaction for the bet (negative amount)
        TransactionEntity tx = new TransactionEntity();
        tx.setMobileNumber(bet.getMobileNumber());
        tx.setAmount(-Math.abs(bet.getAmount()));
        tx.setTxDate(LocalDate.now());
        tx.setTxTime(java.time.LocalTime.now());
        transactionRepository.save(tx);

        Bet saved = betRepository.save(bet);
        log.info("Saved bet id={} mobile={} game={} type={} amount={} newBalance={}", saved.getId(), saved.getMobileNumber(), saved.getGameName(), saved.getType(), saved.getAmount(), newBalance);
        return ResponseEntity.ok(saved);
    }
}
