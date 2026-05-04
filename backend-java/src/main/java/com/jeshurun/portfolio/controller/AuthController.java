package com.jeshurun.portfolio.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if ("admin@test.com".equals(email) && "1234".equals(password)) {
            return ResponseEntity.ok(
                    Map.of("token", "dev-admin-token")
            );
        }

        return ResponseEntity.status(401).body("Invalid credentials");
    }
}