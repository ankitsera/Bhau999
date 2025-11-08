package com.matka.backend.controller;

import com.matka.backend.TransactionEntity;
import com.matka.backend.repository.TransactionRepository;
import com.matka.backend.repository.UserRepository;
import com.matka.backend.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/balance")
public class BalanceController {
    private static final Logger log = LoggerFactory.getLogger(BalanceController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    // Credit a user's balance (used when user wins a bet)
    @PostMapping("/add")
    @Transactional
    public ResponseEntity<?> addToBalance(@RequestBody TransactionEntity request) {
        if (request == null || request.getMobileNumber() == null || request.getAmount() == null) {
            return ResponseEntity.badRequest().body("Missing payload (mobileNumber, amount required)");
        }

        var userOpt = userRepository.findByMobileNumber(request.getMobileNumber());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found: " + request.getMobileNumber());
        }

        var user = userOpt.get();
        Integer current = user.getBalance() == null ? 0 : user.getBalance();
        int newBalance = current + request.getAmount();
        user.setBalance(newBalance);
        userRepository.save(user);

        // record transaction (positive amount)
        TransactionEntity tx = new TransactionEntity();
        tx.setMobileNumber(request.getMobileNumber());
        tx.setAmount(request.getAmount());
        tx.setTxDate(request.getTxDate() == null ? LocalDate.now() : request.getTxDate());
        tx.setTxTime(request.getTxTime() == null ? LocalTime.now() : request.getTxTime());
        transactionRepository.save(tx);

        log.info("Credited user {} amount={} newBalance={}", user.getMobileNumber(), request.getAmount(), newBalance);
        return ResponseEntity.ok(user);
    }
}
