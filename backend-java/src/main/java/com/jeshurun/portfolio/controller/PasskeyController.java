package com.jeshurun.portfolio.controller;

import com.jeshurun.portfolio.entity.User;
import com.jeshurun.portfolio.security.JwtService;
import com.jeshurun.portfolio.security.PasskeyService;
import com.jeshurun.portfolio.security.TotpService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://www.jesh.nz",
        "https://jesh.nz",
        "https://gallery-portfolio-orpin.vercel.app"
})
@RestController
@RequestMapping("/api/auth/passkeys")
public class PasskeyController {
    private final PasskeyService passkeyService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final TotpService totpService;

    public PasskeyController(
            PasskeyService passkeyService,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            TotpService totpService
    ) {
        this.passkeyService = passkeyService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.totpService = totpService;
    }

    @PostMapping("/login/start")
    public ResponseEntity<?> startLogin() {
        try {
            return ResponseEntity.ok(passkeyService.startAuthentication());
        } catch (Exception exception) {
            return ResponseEntity.internalServerError().body("Could not start passkey login");
        }
    }

    @PostMapping("/login/finish")
    public ResponseEntity<?> finishLogin(@RequestBody Map<String, String> body) {
        try {
            User user = passkeyService.finishAuthentication(
                    body.get("challengeId"),
                    body.get("credentialJson")
            );
            return ResponseEntity.ok(Map.of("token", jwtService.generateToken(user.getEmail())));
        } catch (Exception exception) {
            return ResponseEntity.status(401).body("Passkey was not accepted");
        }
    }

    @GetMapping
    public ResponseEntity<?> list(HttpServletRequest request) {
        User user = currentUser(request);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        return ResponseEntity.ok(passkeyService.list(user));
    }

    @PostMapping("/register/start")
    public ResponseEntity<?> startRegistration(
            HttpServletRequest request,
            @RequestBody Map<String, String> body
    ) {
        User user = currentUser(request);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        if (!verifySensitiveAction(user, body)) {
            return ResponseEntity.status(401).body("Password or authenticator code was not accepted");
        }
        try {
            return ResponseEntity.ok(passkeyService.startRegistration(user));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body("Could not start passkey setup");
        }
    }

    @PostMapping("/register/finish")
    public ResponseEntity<?> finishRegistration(
            HttpServletRequest request,
            @RequestBody Map<String, String> body
    ) {
        User user = currentUser(request);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        try {
            return ResponseEntity.ok(passkeyService.finishRegistration(
                    user,
                    body.get("challengeId"),
                    body.get("credentialJson"),
                    body.get("name")
            ));
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body("Passkey could not be saved");
        }
    }

    @DeleteMapping("/{passkeyId}")
    public ResponseEntity<?> delete(
            HttpServletRequest request,
            @PathVariable Long passkeyId,
            @RequestBody Map<String, String> body
    ) {
        User user = currentUser(request);
        if (user == null) return ResponseEntity.status(401).body("Unauthorized");
        if (!verifySensitiveAction(user, body)) {
            return ResponseEntity.status(401).body("Password or authenticator code was not accepted");
        }
        try {
            passkeyService.delete(user, passkeyId);
            return ResponseEntity.ok(Map.of("message", "Passkey removed"));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(exception.getMessage());
        }
    }

    private User currentUser(HttpServletRequest request) {
        return (User) request.getAttribute("user");
    }

    private boolean verifySensitiveAction(User user, Map<String, String> body) {
        String password = body.get("password");
        String code = body.get("code");
        if (password == null || !passwordEncoder.matches(password, user.getPassword())) return false;
        if (!user.isTwoFactorEnabled() || user.getTwoFactorSecret() == null) return false;
        return code != null && totpService.isCodeValid(user.getTwoFactorSecret(), code.trim());
    }
}
