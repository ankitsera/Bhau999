package com.matka.backend.repository;

import com.matka.backend.BetHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BetHistoryRepository extends JpaRepository<BetHistory, Long> {
	List<BetHistory> findByMobileNumber(String mobileNumber);
	List<BetHistory> findByGameName(String gameName);
}
