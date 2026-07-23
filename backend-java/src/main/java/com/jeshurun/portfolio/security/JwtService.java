package com.jeshurun.portfolio.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private static final long SESSION_DURATION_MS = 1000L * 60 * 60 * 24;
    private static final long LOGIN_CHALLENGE_DURATION_MS = 1000L * 60 * 5;
    private static final String CLAIM_PURPOSE = "purpose";
    private static final String PURPOSE_SESSION = "session";
    private static final String PURPOSE_LOGIN_CHALLENGE = "login_challenge";

    private final SecretKey signingKey;

    public JwtService(@Value("${app.jwt-secret}") String secret) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET must contain at least 32 characters");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String email) {
        return generateToken(email, SESSION_DURATION_MS, Map.of(CLAIM_PURPOSE, PURPOSE_SESSION));
    }

    public String generateLoginChallengeToken(String email) {
        return generateToken(
                email,
                LOGIN_CHALLENGE_DURATION_MS,
                Map.of(CLAIM_PURPOSE, PURPOSE_LOGIN_CHALLENGE)
        );
    }

    private String generateToken(String email, long durationMs, Map<String, Object> claims) {
        long now = System.currentTimeMillis();

        return Jwts.builder()
                .subject(email)
                .claims(claims)
                .issuedAt(new Date(now))
                .expiration(new Date(now + durationMs))
                .signWith(signingKey)
                .compact();
    }

    public String extractEmail(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public boolean isTokenValid(String token) {
        return isTokenValid(token, PURPOSE_SESSION);
    }

    public boolean isLoginChallengeTokenValid(String token) {
        return isTokenValid(token, PURPOSE_LOGIN_CHALLENGE);
    }

    private boolean isTokenValid(String token, String expectedPurpose) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return expectedPurpose.equals(claims.get(CLAIM_PURPOSE, String.class));
        } catch (Exception e) {
            return false;
        }
    }
}
