package com.matka.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @Column(name = "mobile_number", nullable = false, length = 10)
    private String mobileNumber;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "date_signup", nullable = false)
    private LocalDateTime dateSignup;
    
    @Column(name = "balance", nullable = false)
    private Integer balance = 0;

    @Column(name = "account_number")
    private String accountNumber;

    @Column(name = "account_holder_name")
    private String accountHolderName;

    @Column(name = "ifsc_code")
    private String ifscCode;

    @Column(name = "upi_id")
    private String upiId;

    @Column(name = "Approval_status")
    private String approvalStatus;

    // FCM device token, used to push per-user events (e.g. balance changed).
    // Nullable: a user may not have registered a device yet, and the token is
    // cleared when FCM reports it as no longer valid.
    @JsonIgnore
    @Column(name = "fcm_token", length = 512)
    private String fcmToken;

    // Nullable: rows created before view modes existed are read as FULL.
    @Enumerated(EnumType.STRING)
    @Column(name = "view_mode", length = 16)
    private UserViewMode viewMode;

    // Getters and setters
    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public LocalDateTime getDateSignup() { return dateSignup; }
    public void setDateSignup(LocalDateTime dateSignup) { this.dateSignup = dateSignup; }
    public Integer getBalance() { return balance; }
    public void setBalance(Integer balance) { this.balance = balance; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }

    public String getAccountHolderName() { return accountHolderName; }
    public void setAccountHolderName(String accountHolderName) { this.accountHolderName = accountHolderName; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(String approvalStatus) { this.approvalStatus = approvalStatus; }

    public String getFcmToken() { return fcmToken; }
    public void setFcmToken(String fcmToken) { this.fcmToken = fcmToken; }

    public UserViewMode getViewMode() { return viewMode == null ? UserViewMode.FULL : viewMode; }
    public void setViewMode(UserViewMode viewMode) { this.viewMode = viewMode; }

    @JsonIgnore
    public boolean isLimitedView() { return getViewMode() == UserViewMode.LIMITED; }
}
