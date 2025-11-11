package com.matka.backend;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "transactions")
public class TransactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mobile_number", nullable = false)
    private String mobileNumber;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Column(name = "tx_date", nullable = false)
    private LocalDate txDate;

    @Column(name = "tx_time", nullable = false)
    private LocalTime txTime;

    // convenience relationship (read-only mapping)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mobile_number", referencedColumnName = "mobile_number", insertable = false, updatable = false)
    private User user;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }

    public LocalDate getTxDate() { return txDate; }
    public void setTxDate(LocalDate txDate) { this.txDate = txDate; }

    public LocalTime getTxTime() { return txTime; }
    public void setTxTime(LocalTime txTime) { this.txTime = txTime; }

    public User getUser() { return user; }
}
