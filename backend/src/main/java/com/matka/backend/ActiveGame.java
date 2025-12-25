package com.matka.backend;

import jakarta.persistence.*;

@Entity
@Table(name = "active_games")
public class ActiveGame {
    @Id
    @Column(name = "game_name")
    private String gameName;

    @Column(name = "open")
    private Integer openPana;

    @Column(name = "close")
    private Integer closePana;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_name", referencedColumnName = "name", insertable = false, updatable = false)
    private Game game;

    public String getGameName() { return gameName; }
    public void setGameName(String gameName) { this.gameName = gameName; }

    public Integer getOpenPana() { return openPana; }
    public void setOpenPana(Integer openPana) { this.openPana = openPana; }

    public Integer getClosePana() { return closePana; }
    public void setClosePana(Integer closePana) { this.closePana = closePana; }

    public Game getGame() { return game; }
}
