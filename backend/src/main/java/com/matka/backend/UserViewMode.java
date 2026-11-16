package com.matka.backend;

/**
 * Which parts of the app a user can see and use.
 *
 * FULL users get everything. LIMITED users can browse games, results and charts,
 * but cannot place bets or move money (deposit, withdraw, bank details).
 */
public enum UserViewMode {
    FULL,
    LIMITED;

    /** Properties key holding the view mode given to users who sign up from now on. */
    public static final String DEFAULT_PROPERTY_KEY = "default_user_view";

    /**
     * Parses a stored or submitted value. Anything unrecognised, including null for
     * users created before view modes existed, is FULL so nobody loses access.
     */
    public static UserViewMode parse(String value) {
        if (value == null) return FULL;
        try {
            return valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return FULL;
        }
    }
}
