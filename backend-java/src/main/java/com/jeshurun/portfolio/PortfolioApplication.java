package com.jeshurun.portfolio;

import com.jeshurun.portfolio.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.context.annotation.Bean;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class PortfolioApplication {

	public static void main(String[] args) {
		SpringApplication.run(PortfolioApplication.class, args);
	}

	@Bean
	CommandLineRunner temporaryTwoFactorRecovery(UserRepository userRepository) {
		return args -> {
			var users = userRepository.findAll();

			for (var user : users) {
				user.setTwoFactorEnabled(false);
				user.setTwoFactorSecret(null);
				user.setTwoFactorPendingSecret(null);
			}

			if (!users.isEmpty()) {
				userRepository.saveAll(users);
				System.out.println("Temporary recovery: cleared 2FA for all users.");
			}
		};
	}

}
