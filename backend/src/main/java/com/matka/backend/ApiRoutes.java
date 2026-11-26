package com.matka.backend;

public final class ApiRoutes {
    // Keep the application route stable. The public, non-predictable route is
    // owned by nginx and is rewritten to this internal route.
    public static final String BASE = "/api";

    private ApiRoutes() {
    }
}
