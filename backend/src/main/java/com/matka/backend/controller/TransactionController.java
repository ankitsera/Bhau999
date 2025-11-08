package com.matka.backend.controller;

import com.matka.backend.TransactionEntity;
import com.matka.backend.repository.TransactionRepository;
import com.matka.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/transaction")
public class TransactionController {
    private static final Logger log = LoggerFactory.getLogger(TransactionController.class);

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody TransactionEntity tx) {
        if (tx == null || tx.getMobileNumber() == null || tx.getAmount() == null) {
            return ResponseEntity.badRequest().body("Missing transaction payload or required fields");
        }

        // verify user exists
        var userOpt = userRepository.findByMobileNumber(tx.getMobileNumber());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body("User not found for mobile: " + tx.getMobileNumber());
        }

        // set date/time if not provided
        if (tx.getTxDate() == null) tx.setTxDate(LocalDate.now());
        if (tx.getTxTime() == null) tx.setTxTime(LocalTime.now());

        // update user's balance atomically
        var user = userOpt.get();
        Integer current = user.getBalance() == null ? 0 : user.getBalance();
        Integer newBalance = current + tx.getAmount();
        user.setBalance(newBalance);
        userRepository.save(user);

        TransactionEntity saved = transactionRepository.save(tx);
        log.info("Saved transaction id={} mobile={} amount={} newBalance={}", saved.getId(), saved.getMobileNumber(), saved.getAmount(), newBalance);
        return ResponseEntity.ok(saved);
    }
}
