package com.jeshurun.portfolio.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private static final long SESSION_DURATION_MS = 1000L * 60 * 60 * 24;
    private static final long LOGIN_CHALLENGE_DURATION_MS = 1000L * 60 * 5;
    private static final String CLAIM_PURPOSE = "purpose";
    private static final String PURPOSE_SESSION = "session";
    private static final String PURPOSE_LOGIN_CHALLENGE = "login_challenge";

    private static final String SECRET =
            "temporary-development-secret-key-must-be-at-least-32-chars";

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
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
                .setSubject(email)
                .addClaims(claims)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + durationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

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
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return expectedPurpose.equals(claims.get(CLAIM_PURPOSE, String.class));
        } catch (Exception e) {
            return false;
        }
    }
}
