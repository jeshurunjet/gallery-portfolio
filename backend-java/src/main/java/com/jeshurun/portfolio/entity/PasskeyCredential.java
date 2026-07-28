package com.jeshurun.portfolio.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "passkey_credentials")
public class PasskeyCredential {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "credential_id", nullable = false, unique = true, length = 1024)
    private String credentialId;

    @Column(name = "user_handle", nullable = false, length = 256)
    private String userHandle;

    @Column(name = "public_key_cose", nullable = false, columnDefinition = "TEXT")
    private String publicKeyCose;

    @Column(name = "signature_count", nullable = false)
    private long signatureCount;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "backup_eligible", nullable = false)
    private boolean backupEligible;

    @Column(name = "backed_up", nullable = false)
    private boolean backedUp;

    @Column(name = "created_at", nullable = false)
    private long createdAt;

    @Column(name = "last_used_at")
    private Long lastUsedAt;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getCredentialId() { return credentialId; }
    public void setCredentialId(String credentialId) { this.credentialId = credentialId; }
    public String getUserHandle() { return userHandle; }
    public void setUserHandle(String userHandle) { this.userHandle = userHandle; }
    public String getPublicKeyCose() { return publicKeyCose; }
    public void setPublicKeyCose(String publicKeyCose) { this.publicKeyCose = publicKeyCose; }
    public long getSignatureCount() { return signatureCount; }
    public void setSignatureCount(long signatureCount) { this.signatureCount = signatureCount; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public boolean isBackupEligible() { return backupEligible; }
    public void setBackupEligible(boolean backupEligible) { this.backupEligible = backupEligible; }
    public boolean isBackedUp() { return backedUp; }
    public void setBackedUp(boolean backedUp) { this.backedUp = backedUp; }
    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
    public Long getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(Long lastUsedAt) { this.lastUsedAt = lastUsedAt; }
}
