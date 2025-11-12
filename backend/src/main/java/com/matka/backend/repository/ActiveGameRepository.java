package com.matka.backend.repository;

import com.matka.backend.ActiveGame;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActiveGameRepository extends JpaRepository<ActiveGame, String> {
}
