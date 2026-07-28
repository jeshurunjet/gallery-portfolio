package com.jeshurun.portfolio.security;

import com.jeshurun.portfolio.entity.PasskeyCredential;
import com.jeshurun.portfolio.entity.User;
import com.jeshurun.portfolio.entity.WebAuthnChallenge;
import com.jeshurun.portfolio.repository.PasskeyCredentialRepository;
import com.jeshurun.portfolio.repository.UserRepository;
import com.jeshurun.portfolio.repository.WebAuthnChallengeRepository;
import com.yubico.webauthn.*;
import com.yubico.webauthn.data.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PasskeyService {
    private static final long CHALLENGE_LIFETIME_MS = 5 * 60 * 1000;
    private final RelyingParty relyingParty;
    private final UserRepository users;
    private final PasskeyCredentialRepository passkeys;
    private final WebAuthnChallengeRepository challenges;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasskeyService(
            PasskeyCredentialStore credentialStore,
            UserRepository users,
            PasskeyCredentialRepository passkeys,
            WebAuthnChallengeRepository challenges,
            @Value("${app.webauthn-rp-id}") String rpId,
            @Value("${app.webauthn-rp-name}") String rpName,
            @Value("${app.webauthn-origins}") String configuredOrigins
    ) {
        this.users = users;
        this.passkeys = passkeys;
        this.challenges = challenges;
        Set<String> origins = Arrays.stream(configuredOrigins.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());
        this.relyingParty = RelyingParty.builder()
                .identity(RelyingPartyIdentity.builder().id(rpId).name(rpName).build())
                .credentialRepository(credentialStore)
                .origins(origins)
                .allowUntrustedAttestation(true)
                .validateSignatureCounter(true)
                .build();
    }

    @Transactional
    public StartResult startRegistration(User user) throws IOException {
        if (user.getPasskeyUserHandle() == null || user.getPasskeyUserHandle().isBlank()) {
            byte[] handle = new byte[32];
            secureRandom.nextBytes(handle);
            user.setPasskeyUserHandle(new ByteArray(handle).getBase64Url());
            users.save(user);
        }

        UserIdentity identity = UserIdentity.builder()
                .name(user.getEmail())
                .displayName(user.getEmail())
                .id(fromBase64Url(user.getPasskeyUserHandle()))
                .build();
        PublicKeyCredentialCreationOptions request = relyingParty.startRegistration(
                StartRegistrationOptions.builder()
                        .user(identity)
                        .authenticatorSelection(AuthenticatorSelectionCriteria.builder()
                                .residentKey(ResidentKeyRequirement.REQUIRED)
                                .userVerification(UserVerificationRequirement.REQUIRED)
                                .build())
                        .timeout(120_000)
                        .build()
        );
        return saveChallenge("registration", user.getId(), request.toJson(), request.toCredentialsCreateJson());
    }

    @Transactional
    public PasskeyView finishRegistration(User authenticatedUser, String challengeId, String credentialJson, String displayName)
            throws Exception {
        WebAuthnChallenge challenge = consumeChallenge(challengeId, "registration");
        if (!authenticatedUser.getId().equals(challenge.getUserId())) {
            throw new IllegalArgumentException("This passkey request belongs to another account");
        }
        PublicKeyCredentialCreationOptions request =
                PublicKeyCredentialCreationOptions.fromJson(challenge.getRequestJson());
        PublicKeyCredential<AuthenticatorAttestationResponse, ClientRegistrationExtensionOutputs> response =
                PublicKeyCredential.parseRegistrationResponseJson(credentialJson);
        RegistrationResult result = relyingParty.finishRegistration(
                FinishRegistrationOptions.builder().request(request).response(response).build()
        );
        if (!result.isUserVerified() || result.isDiscoverable().orElse(false) == false) {
            throw new IllegalArgumentException("A user-verified, device-discoverable passkey is required");
        }

        PasskeyCredential passkey = new PasskeyCredential();
        passkey.setUser(authenticatedUser);
        passkey.setCredentialId(result.getKeyId().getId().getBase64Url());
        passkey.setUserHandle(authenticatedUser.getPasskeyUserHandle());
        passkey.setPublicKeyCose(result.getPublicKeyCose().getBase64());
        passkey.setSignatureCount(result.getSignatureCount());
        passkey.setDisplayName(cleanDisplayName(displayName));
        // Yubico currently marks passkey backup-state reporting as experimental
        // and deprecated. Keep the existing database columns at safe defaults.
        passkey.setBackupEligible(false);
        passkey.setBackedUp(false);
        passkey.setCreatedAt(System.currentTimeMillis());
        return toView(passkeys.save(passkey));
    }

    @Transactional
    public StartResult startAuthentication() throws IOException {
        AssertionRequest request = relyingParty.startAssertion(
                StartAssertionOptions.builder()
                        .userVerification(UserVerificationRequirement.REQUIRED)
                        .timeout(120_000)
                        .build()
        );
        return saveChallenge("authentication", null, request.toJson(), request.toCredentialsGetJson());
    }

    @Transactional
    public User finishAuthentication(String challengeId, String credentialJson) throws Exception {
        WebAuthnChallenge challenge = consumeChallenge(challengeId, "authentication");
        AssertionRequest request = AssertionRequest.fromJson(challenge.getRequestJson());
        PublicKeyCredential<AuthenticatorAssertionResponse, ClientAssertionExtensionOutputs> response =
                PublicKeyCredential.parseAssertionResponseJson(credentialJson);
        AssertionResult result = relyingParty.finishAssertion(
                FinishAssertionOptions.builder().request(request).response(response).build()
        );
        if (!result.isSuccess() || !result.isUserVerified()) {
            throw new IllegalArgumentException("Passkey verification failed");
        }
        PasskeyCredential passkey = passkeys.findByCredentialId(
                        result.getCredential().getCredentialId().getBase64Url()
                )
                .orElseThrow(() -> new IllegalArgumentException("Passkey not found"));
        passkey.setSignatureCount(result.getSignatureCount());
        passkey.setLastUsedAt(System.currentTimeMillis());
        passkeys.save(passkey);
        return passkey.getUser();
    }

    public List<PasskeyView> list(User user) {
        return passkeys.findAllByUser(user).stream().map(this::toView).toList();
    }

    @Transactional
    public void delete(User user, Long passkeyId) {
        PasskeyCredential passkey = passkeys.findById(passkeyId)
                .filter(value -> value.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Passkey not found"));
        passkeys.delete(passkey);
    }

    private StartResult saveChallenge(String purpose, Long userId, String requestJson, String browserOptions) {
        challenges.deleteByExpiresAtLessThan(System.currentTimeMillis());
        WebAuthnChallenge challenge = new WebAuthnChallenge();
        challenge.setId(UUID.randomUUID().toString());
        challenge.setPurpose(purpose);
        challenge.setUserId(userId);
        challenge.setRequestJson(requestJson);
        challenge.setExpiresAt(System.currentTimeMillis() + CHALLENGE_LIFETIME_MS);
        challenges.save(challenge);
        return new StartResult(challenge.getId(), browserOptions);
    }

    private WebAuthnChallenge consumeChallenge(String id, String purpose) {
        WebAuthnChallenge challenge = challenges.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Passkey request expired"));
        challenges.delete(challenge);
        if (!purpose.equals(challenge.getPurpose()) || challenge.getExpiresAt() < System.currentTimeMillis()) {
            throw new IllegalArgumentException("Passkey request expired");
        }
        return challenge;
    }

    private String cleanDisplayName(String value) {
        if (value == null || value.isBlank()) return "My passkey";
        return value.trim().substring(0, Math.min(value.trim().length(), 120));
    }

    private ByteArray fromBase64Url(String value) {
        try {
            return ByteArray.fromBase64Url(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Stored passkey user handle is invalid", exception);
        }
    }

    private PasskeyView toView(PasskeyCredential value) {
        return new PasskeyView(value.getId(), value.getDisplayName(),
                value.getCreatedAt(), value.getLastUsedAt());
    }

    public record StartResult(String challengeId, String publicKeyOptionsJson) {}
    public record PasskeyView(Long id, String name, long createdAt, Long lastUsedAt) {}
}
