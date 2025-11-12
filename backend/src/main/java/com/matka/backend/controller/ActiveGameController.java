package com.matka.backend.controller;

import com.matka.backend.ActiveGame;
import com.matka.backend.repository.ActiveGameRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/active-games")
public class ActiveGameController {

    @Autowired
    private ActiveGameRepository activeGameRepository;

    @GetMapping
    public ResponseEntity<List<ActiveGame>> listAll() {
        List<ActiveGame> list = activeGameRepository.findAll();
        return ResponseEntity.ok(list);
    }
}
