package com.matka.backend;

import jakarta.persistence.*;

@Entity
@Table(name = "properties")
public class Properties {
    @Id
    @Column(name = "prop_key", nullable = false, length = 200)
    private String key;

    @Column(name = "prop_value")
    private String value;

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
