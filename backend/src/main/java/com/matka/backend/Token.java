package com.matka.backend;

import jakarta.persistence.*;

@Entity
@Table(name = "tokens")
public class Token {
    @Id
    @Column(name = "mobile_number", nullable = false, length = 10)
    private String mobileNumber;

    @Column(name = "token", length = 1024)
    private String token;

    // convenience relationship (read-only)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mobile_number", referencedColumnName = "mobile_number", insertable = false, updatable = false)
    private User user;

    public Token() {}

    public Token(String mobileNumber, String token) {
        this.mobileNumber = mobileNumber;
        this.token = token;
    }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public User getUser() { return user; }
}
