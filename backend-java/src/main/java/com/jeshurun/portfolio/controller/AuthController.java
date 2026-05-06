package com.jeshurun.portfolio.controller;

import com.jeshurun.portfolio.entity.User;
import com.jeshurun.portfolio.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.jeshurun.portfolio.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@CrossOrigin(origins = "http://localhost:5173")
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

    public AuthController(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        JavaMailSender mailSender
) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.mailSender = mailSender;
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

        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        String token = jwtService.generateToken(user.getEmail());

        return ResponseEntity.ok(
                Map.of("token", token)
        );
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteAccount(HttpServletRequest request) {
    User user = (User) request.getAttribute("user");

    if (user == null) {
        return ResponseEntity.status(401).body("Unauthorized");
    }

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
                    "email", user.getEmail()
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