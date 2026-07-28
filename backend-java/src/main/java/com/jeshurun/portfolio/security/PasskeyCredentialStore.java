package com.jeshurun.portfolio.security;

import com.jeshurun.portfolio.entity.PasskeyCredential;
import com.jeshurun.portfolio.repository.PasskeyCredentialRepository;
import com.jeshurun.portfolio.repository.UserRepository;
import com.yubico.webauthn.CredentialRepository;
import com.yubico.webauthn.RegisteredCredential;
import com.yubico.webauthn.data.ByteArray;
import com.yubico.webauthn.data.PublicKeyCredentialDescriptor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class PasskeyCredentialStore implements CredentialRepository {
    private final PasskeyCredentialRepository passkeys;
    private final UserRepository users;

    public PasskeyCredentialStore(PasskeyCredentialRepository passkeys, UserRepository users) {
        this.passkeys = passkeys;
        this.users = users;
    }

    @Override
    public Set<PublicKeyCredentialDescriptor> getCredentialIdsForUsername(String username) {
        return users.findByEmail(username)
                .map(passkeys::findAllByUser)
                .orElseGet(java.util.List::of)
                .stream()
                .map(value -> PublicKeyCredentialDescriptor.builder()
                        .id(fromBase64Url(value.getCredentialId()))
                        .build())
                .collect(Collectors.toSet());
    }

    @Override
    public Optional<ByteArray> getUserHandleForUsername(String username) {
        return users.findByEmail(username)
                .map(user -> user.getPasskeyUserHandle())
                .filter(value -> value != null && !value.isBlank())
                .map(this::fromBase64Url);
    }

    @Override
    public Optional<String> getUsernameForUserHandle(ByteArray userHandle) {
        return users.findByPasskeyUserHandle(userHandle.getBase64Url()).map(user -> user.getEmail());
    }

    @Override
    public Optional<RegisteredCredential> lookup(ByteArray credentialId, ByteArray userHandle) {
        return passkeys.findByCredentialId(credentialId.getBase64Url())
                .filter(value -> value.getUserHandle().equals(userHandle.getBase64Url()))
                .map(this::toRegisteredCredential);
    }

    @Override
    public Set<RegisteredCredential> lookupAll(ByteArray credentialId) {
        return passkeys.findByCredentialId(credentialId.getBase64Url())
                .map(value -> Set.of(toRegisteredCredential(value)))
                .orElseGet(Set::of);
    }

    private RegisteredCredential toRegisteredCredential(PasskeyCredential value) {
        return RegisteredCredential.builder()
                .credentialId(fromBase64Url(value.getCredentialId()))
                .userHandle(fromBase64Url(value.getUserHandle()))
                .publicKeyCose(ByteArray.fromBase64(value.getPublicKeyCose()))
                .signatureCount(value.getSignatureCount())
                .build();
    }

    private ByteArray fromBase64Url(String value) {
        try {
            return ByteArray.fromBase64Url(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Stored passkey data is invalid", exception);
        }
    }
}
