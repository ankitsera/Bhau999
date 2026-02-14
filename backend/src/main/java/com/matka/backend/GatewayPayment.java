package com.matka.backend;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "gateway_payments")
public class GatewayPayment {
    @Id
    @Column(name = "cust_ref_num", length = 25)
    private String custRefNum;

    @Column(name = "mobile_number", length = 10)
    private String mobileNumber;

    @Column(name = "amount")
    private Integer amount;

    @Column(name = "tx_date")
    private LocalDate txDate;

    @Column(name = "tx_time")
    private LocalTime txTime;

    @Column(name = "status", length = 10)
    private String status; // Pending, Success, Fail

    @Column(name = "transaction_id")
    private Long transactionId;

    public String getCustRefNum() { return custRefNum; }
    public void setCustRefNum(String custRefNum) { this.custRefNum = custRefNum; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }

    public LocalDate getTxDate() { return txDate; }
    public void setTxDate(LocalDate txDate) { this.txDate = txDate; }

    public LocalTime getTxTime() { return txTime; }
    public void setTxTime(LocalTime txTime) { this.txTime = txTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }
}
