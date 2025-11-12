package com.matka.backend;

import jakarta.persistence.*;

@Entity
@Table(name = "active_games")
public class ActiveGame {
    @Id
    @Column(name = "game_name")
    private String gameName;

    @Column(name = "open")
    private Integer open;

    @Column(name = "close")
    private Integer close;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_name", referencedColumnName = "name", insertable = false, updatable = false)
    private Game game;

    public String getGameName() { return gameName; }
    public void setGameName(String gameName) { this.gameName = gameName; }

    public Integer getOpen() { return open; }
    public void setOpen(Integer open) { this.open = open; }

    public Integer getClose() { return close; }
    public void setClose(Integer close) { this.close = close; }

    public Game getGame() { return game; }
}
