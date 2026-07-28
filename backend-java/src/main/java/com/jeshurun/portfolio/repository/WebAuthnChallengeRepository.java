package com.jeshurun.portfolio.repository;

import com.jeshurun.portfolio.entity.WebAuthnChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WebAuthnChallengeRepository extends JpaRepository<WebAuthnChallenge, String> {
    long deleteByExpiresAtLessThan(long timestamp);
}
