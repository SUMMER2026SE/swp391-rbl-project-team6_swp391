package com.midori.shadowing.subtitle;

import com.midori.shadowing.entities.ShadowingSentence;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Component
public class SubtitleParser {

    /**
     * Parse a standard SRT file input stream into a list of ShadowingSentence entities
     */
    public List<ShadowingSentence> parseSrt(InputStream inputStream) {
        List<ShadowingSentence> list = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            ShadowingSentence current = null;
            int state = 0; // 0: Index, 1: Timestamps, 2: Text

            while ((line = reader.readLine()) != null) {
                line = line.trim();
                
                // BOM check and cleanup if present
                if (line.startsWith("\uFEFF")) {
                    line = line.substring(1);
                }

                if (line.isEmpty()) {
                    if (current != null) {
                        list.add(current);
                        current = null;
                    }
                    state = 0;
                    continue;
                }

                if (state == 0) {
                    current = new ShadowingSentence();
                    try {
                        current.setOrderIndex(Integer.parseInt(line));
                    } catch (NumberFormatException e) {
                        current.setOrderIndex(list.size() + 1);
                    }
                    state = 1;
                } else if (state == 1) {
                    if (line.contains("-->")) {
                        String[] parts = line.split("-->");
                        if (parts.length == 2) {
                            current.setStartTime(parseSrtTime(parts[0].trim()));
                            current.setEndTime(parseSrtTime(parts[1].trim()));
                        }
                    }
                    state = 2;
                } else if (state == 2) {
                    if (current.getJapanese() == null) {
                        current.setJapanese(line);
                    } else {
                        current.setJapanese(current.getJapanese() + "\n" + line);
                    }
                }
            }
            if (current != null) {
                list.add(current);
            }
        } catch (Exception e) {
            // Log parser error
        }
        return list;
    }

    private double parseSrtTime(String srtTime) {
        // Format: 00:00:00,000 or 00:00:00.000
        try {
            String[] parts = srtTime.replace(',', '.').split(":");
            double hours = Double.parseDouble(parts[0]);
            double minutes = Double.parseDouble(parts[1]);
            double seconds = Double.parseDouble(parts[2]);
            return hours * 3600 + minutes * 60 + seconds;
        } catch (Exception e) {
            return 0.0;
        }
    }
}
