package com.midori;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MidoriBeApplication {
    public static void main(String[] args) {
        SpringApplication.run(MidoriBeApplication.class, args);
    }
}
