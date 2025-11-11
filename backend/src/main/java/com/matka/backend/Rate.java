package com.matka.backend;

import jakarta.persistence.*;

@Entity
@Table(name = "rate")
public class Rate {
    @Id
    @Column(name = "type", length = 100)
    private String type;

    @Column(name = "rate", nullable = false)
    private Double rate;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Double getRate() { return rate; }
    public void setRate(Double rate) { this.rate = rate; }
}
