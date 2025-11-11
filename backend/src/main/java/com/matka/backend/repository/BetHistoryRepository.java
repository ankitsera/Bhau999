package com.matka.backend.repository;

import com.matka.backend.BetHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BetHistoryRepository extends JpaRepository<BetHistory, Long> {
}
