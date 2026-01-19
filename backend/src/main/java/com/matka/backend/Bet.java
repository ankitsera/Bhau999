package com.matka.backend;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bets")
public class Bet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mobile_number", nullable = false, length = 10)
    private String mobileNumber;

    @Column(name = "game_name", nullable = false)
    private String gameName;


    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Column(name = "bet_value", length = 7)
    private String betValue;

    @Column(name = "open_close", length = 5)
    private String openClose; // allowed values: "Open", "Close", or null

    @Column(name = "bet_time")
    private LocalDateTime betTime;

    @Column(name = "result", length = 4)
    private String result; // null, "Won", or "Lost"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mobile_number", referencedColumnName = "mobile_number", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_name", referencedColumnName = "name", insertable = false, updatable = false)
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type", referencedColumnName = "type", insertable = false, updatable = false)
    private Rate rate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getGameName() { return gameName; }
    public void setGameName(String gameName) { this.gameName = gameName; }

    // betDate removed by request — date is not stored on bets

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }

    public String getBetValue() { return betValue; }
    public void setBetValue(String betValue) { this.betValue = betValue; }

    public String getOpenClose() { return openClose; }
    public void setOpenClose(String openClose) { this.openClose = openClose; }

    public java.time.LocalDateTime getBetTime() { return betTime; }
    public void setBetTime(java.time.LocalDateTime betTime) { this.betTime = betTime; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public User getUser() { return user; }
    public Game getGame() { return game; }
    public Rate getRate() { return rate; }
}
