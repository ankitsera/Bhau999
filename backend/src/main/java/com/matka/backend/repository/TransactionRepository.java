package com.matka.backend.repository;

import com.matka.backend.TransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDate;

public interface TransactionRepository extends JpaRepository<TransactionEntity, Long> {
    List<TransactionEntity> findByMobileNumber(String mobileNumber);
    List<TransactionEntity> findByStatus(String status);
    List<TransactionEntity> findByAmountLessThan(Integer amount);
    List<TransactionEntity> findByAmountGreaterThan(Integer amount);
    List<TransactionEntity> findByMobileNumberAndAmountLessThan(String mobileNumber, Integer amount);
    List<TransactionEntity> findByMobileNumberAndAmountGreaterThan(String mobileNumber, Integer amount);

    List<TransactionEntity> findByInitiatorIgnoreCase(String initiator);

    List<TransactionEntity> findByAmountGreaterThanAndInitiatorIgnoreCase(Integer amount, String initiator);
    List<TransactionEntity> findByAmountLessThanAndInitiatorIgnoreCase(Integer amount, String initiator);

    List<TransactionEntity> findByMobileNumberAndAmountGreaterThanAndInitiatorIgnoreCase(
            String mobileNumber,
            Integer amount,
            String initiator
    );

    List<TransactionEntity> findByMobileNumberAndAmountLessThanAndInitiatorIgnoreCase(
            String mobileNumber,
            Integer amount,
            String initiator
    );

    List<TransactionEntity> findByStatusAndInitiatorIgnoreCase(String status, String initiator);

    List<TransactionEntity> findByStatusAndAmountLessThanAndInitiatorIgnoreCase(String status, Integer amount, String initiator);
    List<TransactionEntity> findByStatusAndAmountGreaterThanAndInitiatorIgnoreCase(String status, Integer amount, String initiator);
    
        // find transactions by mobile, amount and initiator ordered by id desc so most recent is first
        List<TransactionEntity> findByMobileNumberAndAmountAndInitiatorOrderByIdDesc(String mobileNumber, Integer amount, String initiator);

    long countByMobileNumberAndAmountLessThanAndInitiatorIgnoreCaseAndTxDate(
        String mobileNumber,
        Integer amount,
        String initiator,
        LocalDate txDate
);
}