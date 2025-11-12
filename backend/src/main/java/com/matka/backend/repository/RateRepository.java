package com.matka.backend.repository;

import com.matka.backend.Rate;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RateRepository extends JpaRepository<Rate, String> {
}
