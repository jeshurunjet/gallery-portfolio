package com.jeshurun.portfolio.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;

@Service
public class TotpService {

    private static final char[] BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".toCharArray();
    private static final int SECRET_SIZE_BYTES = 20;
    private static final int TIME_STEP_SECONDS = 30;
    private static final int CODE_DIGITS = 6;
    private static final int ALLOWED_TIME_WINDOW_STEPS = 1;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.totp-issuer:Jesh Portfolio Admin}")
    private String issuer;

    public String generateSecret() {
        byte[] randomBytes = new byte[SECRET_SIZE_BYTES];
        secureRandom.nextBytes(randomBytes);
        return encodeBase32(randomBytes);
    }

    public String buildOtpAuthUrl(String email, String secret) {
        String encodedIssuer = urlEncode(issuer);
        String encodedLabel = urlEncode(issuer + ":" + email);

        return "otpauth://totp/" + encodedLabel
                + "?secret=" + secret
                + "&issuer=" + encodedIssuer
                + "&algorithm=SHA1&digits=" + CODE_DIGITS
                + "&period=" + TIME_STEP_SECONDS;
    }

    public boolean isCodeValid(String secret, String code) {
        if (secret == null || secret.isBlank() || code == null || !code.matches("\\d{6}")) {
            return false;
        }

        long currentCounter = System.currentTimeMillis() / 1000L / TIME_STEP_SECONDS;

        for (long offset = -ALLOWED_TIME_WINDOW_STEPS; offset <= ALLOWED_TIME_WINDOW_STEPS; offset++) {
            String expectedCode = generateCode(secret, currentCounter + offset);
            if (expectedCode.equals(code)) {
                return true;
            }
        }

        return false;
    }

    private String generateCode(String secret, long counter) {
        byte[] key = decodeBase32(secret);
        byte[] counterBytes = new byte[8];

        for (int index = 7; index >= 0; index--) {
            counterBytes[index] = (byte) (counter & 0xff);
            counter >>= 8;
        }

        byte[] hash = hmacSha1(key, counterBytes);
        int offset = hash[hash.length - 1] & 0x0f;
        int binary = ((hash[offset] & 0x7f) << 24)
                | ((hash[offset + 1] & 0xff) << 16)
                | ((hash[offset + 2] & 0xff) << 8)
                | (hash[offset + 3] & 0xff);

        int otp = binary % 1_000_000;
        return String.format("%06d", otp);
    }

    private byte[] hmacSha1(byte[] key, byte[] data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            return mac.doFinal(data);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Failed to generate TOTP code", exception);
        }
    }

    private String encodeBase32(byte[] data) {
        StringBuilder encoded = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = data[0];
        int next = 1;
        int bitsLeft = 8;

        while (bitsLeft > 0 || next < data.length) {
            if (bitsLeft < 5) {
                if (next < data.length) {
                    buffer <<= 8;
                    buffer |= data[next++] & 0xff;
                    bitsLeft += 8;
                } else {
                    int padding = 5 - bitsLeft;
                    buffer <<= padding;
                    bitsLeft += padding;
                }
            }

            int index = (buffer >> (bitsLeft - 5)) & 0x1f;
            bitsLeft -= 5;
            encoded.append(BASE32_ALPHABET[index]);
        }

        return encoded.toString();
    }

    private byte[] decodeBase32(String value) {
        String normalized = value.replace("=", "").replace(" ", "").toUpperCase();
        byte[] decoded = new byte[normalized.length() * 5 / 8];
        int buffer = 0;
        int bitsLeft = 0;
        int outputIndex = 0;

        for (char character : normalized.toCharArray()) {
            int base32Value = decodeBase32Character(character);
            buffer = (buffer << 5) | base32Value;
            bitsLeft += 5;

            if (bitsLeft >= 8) {
                decoded[outputIndex++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xff);
                bitsLeft -= 8;
            }
        }

        return decoded;
    }

    private int decodeBase32Character(char character) {
        if (character >= 'A' && character <= 'Z') {
            return character - 'A';
        }

        if (character >= '2' && character <= '7') {
            return character - '2' + 26;
        }

        throw new IllegalArgumentException("Invalid base32 character");
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
