package com.matka.backend.repository;

import com.matka.backend.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {
	List<TransactionEntity> findByMobileNumber(String mobileNumber);
	List<TransactionEntity> findByStatus(String status);
	List<TransactionEntity> findByAmountLessThan(Integer amount);
}
