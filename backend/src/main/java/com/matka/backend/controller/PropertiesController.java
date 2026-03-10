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

    // Check for app update availability and compulsory update requirement
    // Example: GET /api/properties/check-update?version=0.0.1
    @GetMapping("/check-update")
    public ResponseEntity<?> checkUpdate(@RequestParam(name = "version", required = true) String version) {
        if (version == null || version.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "version is required"));
        }

        boolean compulsoryUpdate = false;
        boolean updateAvailable = false;
        String latestVersion = null;

        // helper to compare semantic versions like 0.0.1
        java.util.function.BiFunction<String, String, Integer> cmp = (v1, v2) -> {
            try {
                String[] a1 = v1.split("\\.");
                String[] a2 = v2.split("\\.");
                for (int i = 0; i < 3; i++) {
                    int n1 = i < a1.length ? Integer.parseInt(a1[i].trim()) : 0;
                    int n2 = i < a2.length ? Integer.parseInt(a2[i].trim()) : 0;
                    if (n1 < n2) return -1;
                    if (n1 > n2) return 1;
                }
                return 0;
            } catch (Exception ex) {
                return null;
            }
        };

        // last_supported_version -> determines compulsory update: if version >= last_supported => compulsory=false else true
        try {
            java.util.Optional<com.matka.backend.Properties> lastOpt = propertiesRepository.findById("last_supported_version");
            if (lastOpt.isPresent()) {
                String last = lastOpt.get().getValue();
                Integer res = cmp.apply(version, last);
                if (res == null) {
                    // parse error -> keep default false
                } else {
                    if (res >= 0) {
                        compulsoryUpdate = false;
                    } else {
                        compulsoryUpdate = true;
                    }
                }
            } else {
                // property not present -> keep false
            }
        } catch (Exception ex) {
            // on error, keep default false
        }

        // latest_version -> determines updateAvailable: if version <= latest_version => updateAvailable = true else false
        try {
            java.util.Optional<com.matka.backend.Properties> latestOpt = propertiesRepository.findById("latest_version");
            if (latestOpt.isPresent()) {
                String latest = latestOpt.get().getValue();
                latestVersion = latest;
                Integer res2 = cmp.apply(version, latest);
                if (res2 == null) {
                    // parse error -> keep default false
                } else {
                    if (res2 < 0) {
                        updateAvailable = true;
                    } else {
                        updateAvailable = false;
                    }
                }
            } else {
                // property not present -> keep false
            }
        } catch (Exception ex) {
            // keep default false
        }

        UpdateCheckResponse resp = new UpdateCheckResponse(compulsoryUpdate, updateAvailable, latestVersion);
        return ResponseEntity.ok(resp);
    }

    // DTO for update check response
    public static class UpdateCheckResponse {
        private boolean compulsoryUpdate;
        private boolean updateAvailable;
        private String latestVersion;

        public UpdateCheckResponse(boolean compulsoryUpdate, boolean updateAvailable, String latestVersion) {
            this.compulsoryUpdate = compulsoryUpdate;
            this.updateAvailable = updateAvailable;
            this.latestVersion = latestVersion;
        }

        public boolean isCompulsoryUpdate() { return compulsoryUpdate; }
        public boolean isUpdateAvailable() { return updateAvailable; }
        public String getLatestVersion() { return latestVersion; }
    }
}
