package com.jeshurun.portfolio.controller;

import com.jeshurun.portfolio.entity.User;
import com.jeshurun.portfolio.repository.UserRepository;
import com.jeshurun.portfolio.repository.PasskeyCredentialRepository;
import com.jeshurun.portfolio.security.RecoveryCodeService;
import com.jeshurun.portfolio.security.TotpService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.jeshurun.portfolio.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://www.jesh.nz",
        "https://jesh.nz",
        "https://gallery-portfolio-orpin.vercel.app"
})
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    // For sending password reset emails
    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.admin-email}")
    private String adminEmail;

    @Value("${app.registration-enabled}")
    private boolean registrationEnabled;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TotpService totpService;
    private final RecoveryCodeService recoveryCodeService;
    private final PasskeyCredentialRepository passkeyCredentialRepository;

    public AuthController(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        JavaMailSender mailSender,
        TotpService totpService,
        RecoveryCodeService recoveryCodeService,
        PasskeyCredentialRepository passkeyCredentialRepository
) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.mailSender = mailSender;
    this.totpService = totpService;
    this.recoveryCodeService = recoveryCodeService;
    this.passkeyCredentialRepository = passkeyCredentialRepository;
}

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        
        // Check if registration is enabled
        if (!registrationEnabled) {
        return ResponseEntity.status(403).body("Registration is disabled");
        }

        String email = body.get("email");
        String password = body.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        User user = new User();
        user.setEmail(email.trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(password));

        userRepository.save(user);

        return ResponseEntity.ok("Account created");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body("Email and password are required");
        }

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        if (user.isTwoFactorEnabled()) {
            String challengeToken = jwtService.generateLoginChallengeToken(user.getEmail());

            return ResponseEntity.ok(
                    Map.of(
                            "requiresTwoFactor", true,
                            "challengeToken", challengeToken
                    )
            );
        }

        String token = jwtService.generateToken(user.getEmail());

        return ResponseEntity.ok(
                Map.of(
                        "requiresTwoFactor", false,
                        "token", token
                )
        );
    }

    @PostMapping("/login/verify")
    public ResponseEntity<?> verifyLogin(@RequestBody Map<String, String> body) {
        String challengeToken = body.get("challengeToken");
        String code = body.get("code");

        if (challengeToken == null || challengeToken.isBlank() || code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body("Challenge token and code are required");
        }

        if (!jwtService.isLoginChallengeTokenValid(challengeToken)) {
            return ResponseEntity.status(401).body("Invalid or expired login challenge");
        }

        String email = jwtService.extractEmail(challengeToken);
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || !user.isTwoFactorEnabled() || user.getTwoFactorSecret() == null) {
            return ResponseEntity.status(401).body("Two-factor authentication is not available");
        }

        String sanitizedCode = code.trim().toUpperCase();
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwtService.generateToken(user.getEmail()));

        if (totpService.isCodeValid(user.getTwoFactorSecret(), sanitizedCode)) {
            return ResponseEntity.ok(response);
        }

        RecoveryCodeService.RecoveryCodeMatchResult recoveryCodeResult =
                recoveryCodeService.consumeCode(user.getTwoFactorRecoveryCodes(), sanitizedCode);

        if (!recoveryCodeResult.matched()) {
            return ResponseEntity.status(401).body("Invalid authentication code");
        }

        user.setTwoFactorRecoveryCodes(recoveryCodeResult.updatedStoredCodes());
        userRepository.save(user);
        response.put("usedRecoveryCode", true);
        response.put("remainingRecoveryCodes", recoveryCodeResult.remainingCodes());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteAccount(HttpServletRequest request) {
    User user = (User) request.getAttribute("user");

    if (user == null) {
        return ResponseEntity.status(401).body("Unauthorized");
    }

    passkeyCredentialRepository.deleteAllByUser(user);
    userRepository.delete(user);

    return ResponseEntity.ok("Account deleted");
    }

    // User's identity on the admin dashboard page
@GetMapping("/me")
public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
    User user = (User) request.getAttribute("user");

    if (user == null) {
        return ResponseEntity.status(401).body("Unauthorized");
    }

    return ResponseEntity.ok(
            Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "twoFactorEnabled", user.isTwoFactorEnabled(),
                    "recoveryCodeCount", recoveryCodeService.countStoredCodes(user.getTwoFactorRecoveryCodes())
            )
    );
}

@GetMapping("/account")
public ResponseEntity<?> getAccountSummary(HttpServletRequest request) {
    User user = (User) request.getAttribute("user");

    if (user == null) {
        return ResponseEntity.status(401).body("Unauthorized");
    }

    return ResponseEntity.ok(
            Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "twoFactorEnabled", user.isTwoFactorEnabled(),
                    "recoveryCodeCount", recoveryCodeService.countStoredCodes(user.getTwoFactorRecoveryCodes()),
                    "registrationEnabled", registrationEnabled,
                    "userCount", userRepository.count()
            )
    );
}

@PostMapping("/2fa/setup")
public ResponseEntity<?> setupTwoFactor(HttpServletRequest request) {
    User user = (User) request.getAttribute("user");

    if (user == null) {
        return ResponseEntity.status(401).body("Unauthorized");
    }

    String secret = totpService.generateSecret();
    user.setTwoFactorPendingSecret(secret);
    userRepository.save(user);

    String otpAuthUrl = totpService.buildOtpAuthUrl(user.getEmail(), secret);

    return ResponseEntity.ok(
            Map.of(
                    "secret", secret,
                    "otpauthUrl", otpAuthUrl,
                    "qrCodeDataUrl", totpService.buildQrCodeDataUrl(otpAuthUrl)
            )
    );
}

@PostMapping("/2fa/enable")
public ResponseEntity<?> enableTwoFactor(HttpServletRequest request, @RequestBody Map<String, String> body) {
    User user = (User) request.getAttribute("user");

    if (user == null) {
        return ResponseEntity.status(401).body("Unauthorized");
    }

    String code = body.get("code");
    String pendingSecret = user.getTwoFactorPendingSecret();

    if (pendingSecret == null || pendingSecret.isBlank()) {
        return ResponseEntity.badRequest().body("Start setup before enabling two-factor authentication");
    }

    if (code == null || code.isBlank() || !totpService.isCodeValid(pendingSecret, code.trim())) {
        return ResponseEntity.status(400).body("Invalid authentication code");
    }

    user.setTwoFactorSecret(pendingSecret);
    user.setTwoFactorPendingSecret(null);
    user.setTwoFactorEnabled(true);
    List<String> recoveryCodes = recoveryCodeService.generatePlainCodes();
    user.setTwoFactorRecoveryCodes(recoveryCodeService.hashCodes(recoveryCodes));
    userRepository.save(user);

    return ResponseEntity.ok(
            Map.of(
                    "message", "Two-factor authentication enabled",
                    "recoveryCodes", recoveryCodes,
                    "recoveryCodeCount", recoveryCodes.size()
            )
    );
}

@PostMapping("/2fa/disable")
public ResponseEntity<?> disableTwoFactor(HttpServletRequest request, @RequestBody Map<String, String> body) {
    User user = (User) request.getAttribute("user");

    if (user == null) {
        return ResponseEntity.status(401).body("Unauthorized");
    }

    String password = body.get("password");
    String code = body.get("code");

    if (password == null || password.isBlank() || code == null || code.isBlank()) {
        return ResponseEntity.badRequest().body("Password and authentication code are required");
    }

    if (!passwordEncoder.matches(password, user.getPassword())) {
        return ResponseEntity.status(401).body("Incorrect password");
    }

    if (!user.isTwoFactorEnabled() || user.getTwoFactorSecret() == null) {
        return ResponseEntity.badRequest().body("Two-factor authentication is already disabled");
    }

    if (!totpService.isCodeValid(user.getTwoFactorSecret(), code.trim())) {
        return ResponseEntity.status(401).body("Invalid authentication code");
    }

    user.setTwoFactorEnabled(false);
    user.setTwoFactorSecret(null);
    user.setTwoFactorPendingSecret(null);
    user.setTwoFactorRecoveryCodes(null);
    userRepository.save(user);

    return ResponseEntity.ok("Two-factor authentication disabled");
}

@PostMapping("/2fa/recovery/regenerate")
public ResponseEntity<?> regenerateRecoveryCodes(
        HttpServletRequest request,
        @RequestBody Map<String, String> body
) {
    User user = (User) request.getAttribute("user");

    if (user == null) {
        return ResponseEntity.status(401).body("Unauthorized");
    }

    String password = body.get("password");
    String code = body.get("code");

    if (password == null || password.isBlank() || code == null || code.isBlank()) {
        return ResponseEntity.badRequest().body("Password and authentication code are required");
    }

    if (!passwordEncoder.matches(password, user.getPassword())) {
        return ResponseEntity.status(401).body("Incorrect password");
    }

    if (!user.isTwoFactorEnabled() || user.getTwoFactorSecret() == null) {
        return ResponseEntity.badRequest().body("Enable two-factor authentication first");
    }

    if (!totpService.isCodeValid(user.getTwoFactorSecret(), code.trim().toUpperCase())) {
        return ResponseEntity.status(401).body("Invalid authentication code");
    }

    List<String> recoveryCodes = recoveryCodeService.generatePlainCodes();
    user.setTwoFactorRecoveryCodes(recoveryCodeService.hashCodes(recoveryCodes));
    userRepository.save(user);

    return ResponseEntity.ok(
            Map.of(
                    "recoveryCodes", recoveryCodes,
                    "recoveryCodeCount", recoveryCodes.size()
            )
    );
}

@PostMapping("/forgot")
public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {

    String email = body.get("email").trim().toLowerCase();

    System.out.println("FORGOT REQUEST EMAIL: " + email);
    System.out.println("ADMIN EMAIL: " + adminEmail);

    User user = userRepository.findByEmail(email).orElse(null);

    System.out.println("USER FOUND: " + (user != null));

    if (user == null) {
        return ResponseEntity.ok("If account exists, reset link sent");
    }

    String token = java.util.UUID.randomUUID().toString();

    user.setResetToken(token);
    user.setResetTokenExpiry(System.currentTimeMillis() + (1000 * 60 * 15)); // 15 min

    userRepository.save(user);

    // for sending email (in production, use a real email service)
    String resetLink = frontendUrl + "/reset-password?token=" + token;

    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(adminEmail);
    message.setSubject("Portfolio Admin Password Reset");
    message.setText(
            "A password reset was requested for your portfolio admin account.\n\n" +
            "Reset your password here:\n" + resetLink + "\n\n" +
            "This link expires in 15 minutes."
    );

    try {
        mailSender.send(message);
        System.out.println("EMAIL SENT SUCCESSFULLY");
        return ResponseEntity.ok("Reset link sent if the account exists");
    } catch (Exception e) {
        System.out.println("EMAIL FAILED");
        e.printStackTrace();

        return ResponseEntity.status(500)
                .body("Email failed: " + e.getMessage());
    }
}

@PostMapping("/reset")
public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
    String token = body.get("token");
    String newPassword = body.get("password");

    User user = userRepository.findAll().stream()
            .filter(u -> token.equals(u.getResetToken()))
            .findFirst()
            .orElse(null);

    if (user == null) {
        return ResponseEntity.status(400).body("Invalid token");
    }

    if (user.getResetTokenExpiry() == null ||
        user.getResetTokenExpiry() < System.currentTimeMillis()) {
        return ResponseEntity.status(400).body("Token expired");
    }

    // update password (bcrypt)
    user.setPassword(passwordEncoder.encode(newPassword));

    // clear reset token
    user.setResetToken(null);
    user.setResetTokenExpiry(null);

    userRepository.save(user);

    return ResponseEntity.ok("Password reset successful");
}

}
