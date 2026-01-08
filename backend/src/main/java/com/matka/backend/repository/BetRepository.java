package com.matka.backend.repository;

import com.matka.backend.Bet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BetRepository extends JpaRepository<Bet, Long> {
	List<Bet> findByMobileNumber(String mobileNumber);
	List<Bet> findByGameName(String gameName);
}
