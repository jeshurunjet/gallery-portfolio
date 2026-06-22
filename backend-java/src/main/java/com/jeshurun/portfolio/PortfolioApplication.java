package com.jeshurun.portfolio;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class PortfolioApplication {

	public static void main(String[] args) {
		SpringApplication.run(PortfolioApplication.class, args);
	}

	@Bean
	CommandLineRunner temporaryTwoFactorRecovery(JdbcTemplate jdbcTemplate) {
		return args -> {
			jdbcTemplate.execute("""
				ALTER TABLE users
				ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT false
			""");
			jdbcTemplate.execute("""
				ALTER TABLE users
				ADD COLUMN IF NOT EXISTS two_factor_secret varchar(255)
			""");
			jdbcTemplate.execute("""
				ALTER TABLE users
				ADD COLUMN IF NOT EXISTS two_factor_pending_secret varchar(255)
			""");

			int updatedRows = jdbcTemplate.update("""
				UPDATE users
				SET two_factor_enabled = false,
				    two_factor_secret = null,
				    two_factor_pending_secret = null
			""");

			if (updatedRows > 0) {
				System.out.println("Temporary recovery: cleared 2FA for all users.");
			}
		};
	}

}
