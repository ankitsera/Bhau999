package com.matka.backend.controller;

import com.matka.backend.Rate;
import com.matka.backend.ApiRoutes;
import com.matka.backend.Properties;
import com.matka.backend.repository.RateRepository;
import com.matka.backend.repository.PropertiesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping(ApiRoutes.BASE + "/rate")
public class RateController {
    private static final Logger log = LoggerFactory.getLogger(RateController.class);

    @Autowired
    private RateRepository rateRepository;
    @Autowired
    private PropertiesRepository propertiesRepository;

    // Create or update a rate
    @PostMapping
    public ResponseEntity<?> createOrUpdate(@RequestBody Rate rate) {
        if (rate == null || rate.getType() == null) {
            return ResponseEntity.badRequest().body("Missing rate payload or type");
        }
        // read base_rate from properties; default to 1
        double minBet = 1.0;
        try {
            java.util.Optional<Properties> po = propertiesRepository.findById("base_rate");
            if (po.isPresent()) {
                String val = po.get().getValue();
                if (val != null) {
                    minBet = Double.parseDouble(val.trim());
                    if (minBet == 0) minBet = 1.0;
                }
            }
        } catch (Exception ex) {
            log.warn("Unable to read base_rate property, defaulting to 1", ex);
            minBet = 1.0;
        }

        // divide incoming rate by minBet before saving to DB
        Double incoming = rate.getRate() == null ? 0.0 : rate.getRate();
        Rate toSave = new Rate();
        toSave.setType(rate.getType());
        toSave.setRate(incoming / minBet);

        Rate saved = rateRepository.save(toSave);
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
        double minBet = 1.0;
        try {
            java.util.Optional<Properties> po = propertiesRepository.findById("base_rate");
            if (po.isPresent()) {
                String val = po.get().getValue();
                if (val != null) {
                    minBet = Double.parseDouble(val.trim());
                    if (minBet == 0) minBet = 1.0;
                }
            }
        } catch (Exception ex) {
            log.warn("Unable to read base_rate property, defaulting to 1", ex);
            minBet = 1.0;
        }

        // return rates in a specific order and multiplied by minBet for display
        String[] orderedTypes = new String[] {
                "Single Digit",
                "Jodi",
                "Single Pana",
                "Double Pana",
                "Triple Pana",
                "Half Sangam",
                "Full Sangam"
        };

        List<Rate> out = new java.util.ArrayList<>();
        for (String t : orderedTypes) {
            try {
                java.util.Optional<Rate> ro = rateRepository.findById(t);
                if (ro.isPresent()) {
                    Rate r = ro.get();
                    Rate copy = new Rate();
                    copy.setType(r.getType());
                    Double stored = r.getRate() == null ? 0.0 : r.getRate();
                    copy.setRate(stored * minBet);
                    out.add(copy);
                }
            } catch (Exception ex) {
                log.warn("Error loading rate for type {}", t, ex);
            }
        }

        return ResponseEntity.ok(out);
    }
}
