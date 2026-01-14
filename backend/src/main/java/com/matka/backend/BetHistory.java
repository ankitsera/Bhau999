package com.matka.backend;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bets_history")
public class BetHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mobile_number", nullable = false)
    private String mobileNumber;

    @Column(name = "game_name", nullable = false)
    private String gameName;

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Column(name = "bet_value")
    private Integer betValue;

    @Column(name = "open_close")
    private String openClose;

    @Column(name = "bet_time")
    private LocalDateTime betTime;

    @Column(name = "result")
    private String result;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getGameName() { return gameName; }
    public void setGameName(String gameName) { this.gameName = gameName; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }

    public Integer getBetValue() { return betValue; }
    public void setBetValue(Integer betValue) { this.betValue = betValue; }

    public String getOpenClose() { return openClose; }
    public void setOpenClose(String openClose) { this.openClose = openClose; }

    public java.time.LocalDateTime getBetTime() { return betTime; }
    public void setBetTime(java.time.LocalDateTime betTime) { this.betTime = betTime; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
}
