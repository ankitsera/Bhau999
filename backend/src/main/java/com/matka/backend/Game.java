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

    @Column(name = "saturday")
    private Boolean saturday;

    @Column(name = "sunday")
    private Boolean sunday;

    @Column(name = "enabled")
    private Boolean enabled;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public LocalTime getOpenTime() { return openTime; }
    public void setOpenTime(LocalTime openTime) { this.openTime = openTime; }

    public LocalTime getCloseTime() { return closeTime; }
    public void setCloseTime(LocalTime closeTime) { this.closeTime = closeTime; }

    public Boolean getSaturday() { return saturday; }
    public void setSaturday(Boolean saturday) { this.saturday = saturday; }

    public Boolean getSunday() { return sunday; }
    public void setSunday(Boolean sunday) { this.sunday = sunday; }

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}
