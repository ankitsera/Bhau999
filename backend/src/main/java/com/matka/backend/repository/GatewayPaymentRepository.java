package com.matka.backend.repository;

import com.matka.backend.GatewayPayment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GatewayPaymentRepository extends JpaRepository<GatewayPayment, String> {
}
