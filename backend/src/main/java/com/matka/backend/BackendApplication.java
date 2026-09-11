package com.matka.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.ZoneId;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class BackendApplication {

	/**
	 * Game, bet and withdrawal times are all Indian Standard Time. Pinned here so the
	 * rules do not shift by hours when the host machine is set to UTC.
	 */
	public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

	public static void main(String[] args) {
		// Every LocalDate.now()/LocalTime.now() in the app reads this default zone.
		TimeZone.setDefault(TimeZone.getTimeZone(ZONE));
		SpringApplication.run(BackendApplication.class, args);
	}

}
