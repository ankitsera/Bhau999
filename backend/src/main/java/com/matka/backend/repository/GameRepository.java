package com.matka.backend.repository;

import com.matka.backend.Game;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<Game, String> {
	// findByName is provided by JpaRepository via findById but convenience methods can be added if needed
}
