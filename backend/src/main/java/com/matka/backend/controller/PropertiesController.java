package com.matka.backend.controller;

import com.matka.backend.Properties;
import com.matka.backend.repository.PropertiesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/properties")
public class PropertiesController {

    @Autowired
    private PropertiesRepository propertiesRepository;

    // Create or update a property. Body: { "key": "my.key", "value": "some value" }
    @PostMapping
    public ResponseEntity<?> createOrUpdate(@RequestBody Properties prop) {
        if (prop == null || prop.getKey() == null || prop.getKey().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "key is required"));
        }
        String normalized = prop.getKey().trim();
        prop.setKey(normalized);
        Properties saved = propertiesRepository.save(prop);
        return ResponseEntity.ok(Map.of("message", "Property saved", "property", saved));
    }

    // Delete a property by key
    @DeleteMapping("/{key}")
    public ResponseEntity<?> delete(@PathVariable("key") String key) {
        if (key == null || key.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "key is required"));
        }
        String normalized = key.trim();
        Optional<Properties> p = propertiesRepository.findById(normalized);
        if (p.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Property not found"));
        }
        propertiesRepository.deleteById(normalized);
        return ResponseEntity.ok(Map.of("message", "Property deleted", "key", normalized));
    }

    // List all properties
    @GetMapping
    public ResponseEntity<List<Properties>> listAll() {
        List<Properties> list = propertiesRepository.findAll();
        return ResponseEntity.ok(list);
    }

    // Get a property by key
    @GetMapping("/{key}")
    public ResponseEntity<?> getByKey(@PathVariable("key") String key) {
        if (key == null || key.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "key is required"));
        }
        String normalized = key.trim();
        Optional<Properties> p = propertiesRepository.findById(normalized);
        if (p.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Property not found"));
        }
        return ResponseEntity.ok(Map.of("message", "Property found", "property", p.get()));
    }
}
