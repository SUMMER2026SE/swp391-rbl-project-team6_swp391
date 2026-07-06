package com.midori;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.boot.CommandLineRunner;

public class HashGenerator implements CommandLineRunner {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "MidoriAdmin2026!";
        String hash = encoder.encode(password);
        System.out.println("Hash: " + hash);
        System.exit(0);
    }

    @Override
    public void run(String... args) throws Exception {
        main(args);
    }
}
