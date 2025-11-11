package com.matka.backend;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "game")
public class Game {
    @Id
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "open_time")
    private LocalTime openTime;

    @Column(name = "close_time")
    private LocalTime closeTime;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalTime getOpenTime() { return openTime; }
    public void setOpenTime(LocalTime openTime) { this.openTime = openTime; }

    public LocalTime getCloseTime() { return closeTime; }
    public void setCloseTime(LocalTime closeTime) { this.closeTime = closeTime; }
}
