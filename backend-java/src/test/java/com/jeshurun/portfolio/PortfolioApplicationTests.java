package com.jeshurun.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.Autowired;
import com.jeshurun.portfolio.security.PasskeyService;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
	"spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
	"spring.datasource.driver-class-name=org.h2.Driver",
	"spring.datasource.username=sa",
	"spring.datasource.password=",
	"spring.jpa.hibernate.ddl-auto=create-drop",
	"spring.jpa.show-sql=false",
	"cloudinary.cloud-name=test",
	"cloudinary.api-key=test",
	"cloudinary.api-secret=test",
	"spring.mail.host=smtp.gmail.com",
	"spring.mail.port=587",
	"spring.mail.username=test",
	"spring.mail.password=test",
	"spring.mail.properties.mail.smtp.auth=true",
	"spring.mail.properties.mail.smtp.starttls.enable=true",
	"app.admin-email=test@example.com",
	"app.frontend-url=http://localhost:5173",
	"app.registration-enabled=false",
	"app.jwt-secret=test-only-jwt-secret-that-is-long-enough"
})
class PortfolioApplicationTests {
	@Autowired
	private PasskeyService passkeyService;

	@Test
	void contextLoads() {
	}

	@Test
	void createsPasskeyLoginOptions() throws Exception {
		PasskeyService.StartResult result = passkeyService.startAuthentication();
		assertFalse(result.challengeId().isBlank());
		assertTrue(result.publicKeyOptionsJson().contains("\"challenge\""));
		assertTrue(result.publicKeyOptionsJson().contains("\"userVerification\":\"required\""));
	}

}
