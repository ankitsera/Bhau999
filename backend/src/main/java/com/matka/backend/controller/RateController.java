package com.matka.backend.controller;

import com.matka.backend.Rate;
import com.matka.backend.repository.RateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rate")
public class RateController {
    private static final Logger log = LoggerFactory.getLogger(RateController.class);

    @Autowired
    private RateRepository rateRepository;

    // Create or update a rate
    @PostMapping
    public ResponseEntity<?> createOrUpdate(@RequestBody Rate rate) {
        if (rate == null || rate.getType() == null) {
            return ResponseEntity.badRequest().body("Missing rate payload or type");
        }
        Rate saved = rateRepository.save(rate);
        log.info("Saved rate type={} value={}", saved.getType(), saved.getRate());
        return ResponseEntity.ok(saved);
    }

    // Delete a rate by type
    @DeleteMapping("/{type}")
    public ResponseEntity<?> delete(@PathVariable("type") String type) {
        Optional<Rate> r = rateRepository.findById(type);
        if (r.isEmpty()) {
            return ResponseEntity.status(404).body("Rate not found");
        }
        rateRepository.deleteById(type);
        log.info("Deleted rate type={}", type);
        return ResponseEntity.ok(Map.of("deleted", type));
    }

    // List all rates
    @GetMapping
    public ResponseEntity<List<Rate>> listAll() {
        List<Rate> list = rateRepository.findAll();
        return ResponseEntity.ok(list);
    }
}
