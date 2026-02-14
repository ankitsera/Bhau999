package com.matka.backend;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

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

    @Column(name = "initiator")
    private String initiator; // "Admin" or "User"

    @Column(name = "status")
    private String status; // "Pending", "Approved", "Rejected", or null

    @Column(name = "remarks", length = 100)
    private String remarks;

    // convenience relationship (read-only mapping)
    @JsonIgnore
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

    public String getInitiator() { return initiator; }
    public void setInitiator(String initiator) { this.initiator = initiator; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public User getUser() { return user; }
}
