package com.matka.backend;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "game_history")
public class GameHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // store the game's name as FK to game(name)
    @Column(name = "game_name", nullable = false)
    private String gameName;

    @Column(name = "hist_date", nullable = false)
    private LocalDate histDate;

    @Column(name = "open")
    private Integer open;

    @Column(name = "close")
    private Integer close;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_name", referencedColumnName = "name", insertable = false, updatable = false)
    private Game game;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getGameName() { return gameName; }
    public void setGameName(String gameName) { this.gameName = gameName; }

    public LocalDate getHistDate() { return histDate; }
    public void setHistDate(LocalDate histDate) { this.histDate = histDate; }

    public Integer getOpen() { return open; }
    public void setOpen(Integer open) { this.open = open; }

    public Integer getClose() { return close; }
    public void setClose(Integer close) { this.close = close; }

    public Game getGame() { return game; }
}
