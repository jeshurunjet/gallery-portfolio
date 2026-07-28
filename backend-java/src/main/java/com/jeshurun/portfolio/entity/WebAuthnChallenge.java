package com.jeshurun.portfolio.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "webauthn_challenges")
public class WebAuthnChallenge {
    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 20)
    private String purpose;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "request_json", nullable = false, columnDefinition = "TEXT")
    private String requestJson;

    @Column(name = "expires_at", nullable = false)
    private long expiresAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getRequestJson() { return requestJson; }
    public void setRequestJson(String requestJson) { this.requestJson = requestJson; }
    public long getExpiresAt() { return expiresAt; }
    public void setExpiresAt(long expiresAt) { this.expiresAt = expiresAt; }
}
