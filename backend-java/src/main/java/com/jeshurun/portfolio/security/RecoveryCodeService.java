package com.jeshurun.portfolio.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecoveryCodeService {

    private static final int RECOVERY_CODE_COUNT = 8;
    private static final int RECOVERY_CODE_LENGTH = 10;
    private static final String CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final SecureRandom secureRandom = new SecureRandom();
    private final PasswordEncoder passwordEncoder;

    public RecoveryCodeService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    public List<String> generatePlainCodes() {
        List<String> codes = new ArrayList<>();

        for (int index = 0; index < RECOVERY_CODE_COUNT; index++) {
            codes.add(generateCode());
        }

        return codes;
    }

    public String hashCodes(List<String> plainCodes) {
        return plainCodes.stream()
                .map(passwordEncoder::encode)
                .collect(Collectors.joining("\n"));
    }

    public int countStoredCodes(String storedCodes) {
        return getStoredCodes(storedCodes).size();
    }

    public RecoveryCodeMatchResult consumeCode(String storedCodes, String candidateCode) {
        List<String> hashedCodes = getStoredCodes(storedCodes);

        for (int index = 0; index < hashedCodes.size(); index++) {
            if (passwordEncoder.matches(candidateCode, hashedCodes.get(index))) {
                hashedCodes.remove(index);
                return new RecoveryCodeMatchResult(true, String.join("\n", hashedCodes), hashedCodes.size());
            }
        }

        return new RecoveryCodeMatchResult(false, storedCodes, hashedCodes.size());
    }

    private List<String> getStoredCodes(String storedCodes) {
        if (storedCodes == null || storedCodes.isBlank()) {
            return new ArrayList<>();
        }

        return Arrays.stream(storedCodes.split("\\R"))
                .map(String::trim)
                .filter(code -> !code.isBlank())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private String generateCode() {
        StringBuilder builder = new StringBuilder(RECOVERY_CODE_LENGTH + 1);

        for (int index = 0; index < RECOVERY_CODE_LENGTH; index++) {
            if (index == 5) {
                builder.append('-');
            }

            int randomIndex = secureRandom.nextInt(CODE_CHARACTERS.length());
            builder.append(CODE_CHARACTERS.charAt(randomIndex));
        }

        return builder.toString();
    }

    public record RecoveryCodeMatchResult(boolean matched, String updatedStoredCodes, int remainingCodes) {}
}
