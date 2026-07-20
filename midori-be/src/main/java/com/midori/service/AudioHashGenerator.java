package com.midori.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Component
@Slf4j
public class AudioHashGenerator {

    public String hash(byte[] audio) {
        if (audio == null || audio.length == 0) {
            return "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(audio);
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException ex) {
            log.warn("[AudioHashGenerator] SHA-256 not available", ex);
            return Integer.toHexString(audio.length);
        }
    }
}
