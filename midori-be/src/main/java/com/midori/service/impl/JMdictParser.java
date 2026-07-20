package com.midori.service.impl;

import com.midori.entity.DictionaryEntry;
import com.midori.entity.DictionaryMeaning;
import com.midori.repository.DictionaryEntryRepository;
import com.midori.repository.DictionaryMeaningRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.xml.stream.XMLInputFactory;
import javax.xml.stream.XMLStreamConstants;
import javax.xml.stream.XMLStreamReader;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class JMdictParser {

    private final DictionaryEntryRepository dictionaryEntryRepository;
    private final DictionaryMeaningRepository dictionaryMeaningRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private static final int BATCH_SIZE = 500;
    private static final String[] PRIORITY_CODES = {"ichi1", "ichi2", "news1", "news2", "spec1", "spec2", "gai1", "gai2"};

    public ImportResult importJMdict(InputStream xmlInputStream) {
        long startTime = System.currentTimeMillis();
        log.info("Starting JMdict full import (~180,000 entries)...");
        System.out.println("Starting JMdict full import...");

        int imported = 0;
        int skipped = 0;
        int failed = 0;

        List<DictionaryEntry> entryBatch = new ArrayList<>();
        List<DictionaryMeaning> meaningBatch = new ArrayList<>();
        Map<String, Long> entSeqMap = new HashMap<>();

        try {
            System.setProperty("jdk.xml.entityExpansionLimit", "0");
            XMLInputFactory factory = XMLInputFactory.newInstance();
            factory.setProperty(XMLInputFactory.SUPPORT_DTD, false);
            factory.setProperty(XMLInputFactory.IS_SUPPORTING_EXTERNAL_ENTITIES, false);

            XMLStreamReader reader = factory.createXMLStreamReader(xmlInputStream);

            String currentTag = "";
            long currentSeq = 0;
            List<String> kebList = new ArrayList<>();
            List<String> rebList = new ArrayList<>();
            List<String> kePriList = new ArrayList<>();
            List<String> rePriList = new ArrayList<>();
            List<String> posList = new ArrayList<>();
            List<String> glossList = new ArrayList<>();
            String rawXml = "";
            StringBuilder xmlBuilder = new StringBuilder();

            while (reader.hasNext()) {
                int event = reader.next();

                switch (event) {
                    case XMLStreamConstants.START_ELEMENT:
                        currentTag = reader.getLocalName();
                        if ("entry".equals(currentTag)) {
                            kebList.clear();
                            rebList.clear();
                            kePriList.clear();
                            rePriList.clear();
                            posList.clear();
                            glossList.clear();
                            xmlBuilder.setLength(0);
                            rawXml = "";
                        } else if ("gloss".equals(currentTag)) {
                            String gLang = reader.getAttributeValue(null, "xml:lang");
                            if (gLang == null || "en".equals(gLang)) {
                                // Keep English glosses
                            }
                        }
                        break;

                    case XMLStreamConstants.CHARACTERS:
                        String text = reader.getText().trim();
                        if (text.isEmpty()) break;

                        switch (currentTag) {
                            case "ent_seq":
                                try {
                                    currentSeq = Long.parseLong(text);
                                } catch (NumberFormatException ignored) {}
                                break;
                            case "keb":
                                kebList.add(text);
                                break;
                            case "reb":
                                rebList.add(text);
                                break;
                            case "ke_pri":
                                kePriList.add(text);
                                break;
                            case "re_pri":
                                rePriList.add(text);
                                break;
                            case "pos":
                                if (!posList.contains(text)) posList.add(text);
                                break;
                            case "gloss":
                                if (!glossList.contains(text) && glossList.size() < 5) {
                                    glossList.add(text);
                                }
                                break;
                        }
                        break;

                    case XMLStreamConstants.END_ELEMENT:
                        String endTag = reader.getLocalName();
                        if ("entry".equals(endTag)) {
                            if (currentSeq > 0 && !rebList.isEmpty() && !glossList.isEmpty()) {
                                String surface = kebList.isEmpty() ? rebList.get(0) : kebList.get(0);
                                String reading = rebList.isEmpty() ? null : rebList.get(0);
                                String priority = getHighestPriority(kePriList, rePriList);
                                String partOfSpeech = posList.isEmpty() ? null : String.join(", ", posList);
                                String romaji = reading != null ? toRomaji(reading) : null;

                                DictionaryEntry entry = DictionaryEntry.builder()
                                        .surface(surface)
                                        .lemma(surface)
                                        .reading(reading)
                                        .romaji(romaji)
                                        .partOfSpeech(partOfSpeech)
                                        .jmdictSeq(currentSeq)
                                        .jmdictPri(priority)
                                        .jmdictKePri(kePriList.isEmpty() ? null : kePriList.toArray(new String[0]))
                                        .jmdictRePri(rePriList.isEmpty() ? null : rePriList.toArray(new String[0]))
                                        .build();

                                entryBatch.add(entry);
                                entSeqMap.put(surface + "|" + (reading != null ? reading : ""), currentSeq);

                                int glossIndex = 0;
                                for (String gloss : glossList) {
                                    DictionaryMeaning meaning = DictionaryMeaning.builder()
                                            .entry(entry)
                                            .language("en")
                                            .meaning(gloss)
                                            .sortOrder(glossIndex++)
                                            .build();
                                    meaningBatch.add(meaning);
                                }

                                if (entryBatch.size() >= BATCH_SIZE) {
                                    saveBatch(entryBatch, meaningBatch);
                                    imported += entryBatch.size();
                                    entryBatch.clear();
                                    meaningBatch.clear();
                                    if (imported % 10000 == 0) {
                                        log.info("Imported {} entries...", imported);
                                        System.out.println("Imported: " + imported);
                                    }
                                }
                            } else {
                                skipped++;
                            }
                        }
                        currentTag = "";
                        break;
                }
            }

            reader.close();

            if (!entryBatch.isEmpty()) {
                saveBatch(entryBatch, meaningBatch);
                imported += entryBatch.size();
            }

        } catch (Exception e) {
            log.error("JMdict import error: {}", e.getMessage(), e);
            failed++;
            e.printStackTrace();
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("JMdict import completed!");
        log.info("Imported: {}, Skipped: {}, Failed: {}", imported, skipped, failed);
        log.info("Duration: {} ms ({} minutes)", duration, duration / 60000);

        System.out.println("JMdict import completed!");
        System.out.println("Imported: " + imported);
        System.out.println("Skipped: " + skipped);
        System.out.println("Failed: " + failed);
        System.out.println("Duration: " + (duration / 60000) + " minutes");

        return new ImportResult(imported, skipped, failed, duration);
    }

    @Transactional
    protected void saveBatch(List<DictionaryEntry> entries, List<DictionaryMeaning> meanings) {
        for (int i = 0; i < entries.size(); i++) {
            entityManager.persist(entries.get(i));
            if ((i + 1) % 50 == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
        entityManager.clear();

        for (int i = 0; i < meanings.size(); i++) {
            entityManager.persist(meanings.get(i));
            if ((i + 1) % 50 == 0) {
                entityManager.flush();
                entityManager.clear();
            }
        }
        entityManager.flush();
        entityManager.clear();
    }

    private String getHighestPriority(List<String> kePri, List<String> rePri) {
        List<String> combined = new ArrayList<>(kePri);
        combined.addAll(rePri);

        for (String code : PRIORITY_CODES) {
            if (combined.contains(code)) {
                return code;
            }
        }
        return combined.isEmpty() ? null : combined.get(0);
    }

    private String toRomaji(String kana) {
        if (kana == null || kana.isEmpty()) return null;

        Map<String, String> hiraganaMap = new LinkedHashMap<>();
        hiraganaMap.put("きゃ", "kya");
        hiraganaMap.put("きゅ", "kyu");
        hiraganaMap.put("きょ", "kyo");
        hiraganaMap.put("しゃ", "sha");
        hiraganaMap.put("しゅ", "shu");
        hiraganaMap.put("しょ", "sho");
        hiraganaMap.put("ちゃ", "cha");
        hiraganaMap.put("ちゅ", "chu");
        hiraganaMap.put("ちょ", "cho");
        hiraganaMap.put("にゃ", "nya");
        hiraganaMap.put("にゅ", "nyu");
        hiraganaMap.put("にょ", "nyo");
        hiraganaMap.put("ひゃ", "hya");
        hiraganaMap.put("ひゅ", "hyu");
        hiraganaMap.put("ひょ", "hyo");
        hiraganaMap.put("みゃ", "mya");
        hiraganaMap.put("みゅ", "myu");
        hiraganaMap.put("みょ", "myo");
        hiraganaMap.put("りゃ", "rya");
        hiraganaMap.put("りゅ", "ryu");
        hiraganaMap.put("りょ", "ryo");
        hiraganaMap.put("ぎゃ", "gya");
        hiraganaMap.put("ぎゅ", "gyu");
        hiraganaMap.put("ぎょ", "gyo");
        hiraganaMap.put("じゃ", "ja");
        hiraganaMap.put("じゅ", "ju");
        hiraganaMap.put("じょ", "jo");
        hiraganaMap.put("びゃ", "bya");
        hiraganaMap.put("びゅ", "byu");
        hiraganaMap.put("びょ", "byo");
        hiraganaMap.put("ぴゃ", "pya");
        hiraganaMap.put("ぴゅ", "pyu");
        hiraganaMap.put("ぴょ", "pyo");
        hiraganaMap.put("いぇ", "ye");
        hiraganaMap.put("うぃ", "wi");
        hiraganaMap.put("うぇ", "we");
        hiraganaMap.put("くゃ", "kwa");
        hiraganaMap.put("くゅ", "kwu");
        hiraganaMap.put("くょ", "kwo");
        hiraganaMap.put("ぐゃ", "gwa");

        hiraganaMap.put("あ", "a");
        hiraganaMap.put("い", "i");
        hiraganaMap.put("う", "u");
        hiraganaMap.put("え", "e");
        hiraganaMap.put("お", "o");
        hiraganaMap.put("か", "ka");
        hiraganaMap.put("き", "ki");
        hiraganaMap.put("く", "ku");
        hiraganaMap.put("け", "ke");
        hiraganaMap.put("こ", "ko");
        hiraganaMap.put("さ", "sa");
        hiraganaMap.put("し", "shi");
        hiraganaMap.put("す", "su");
        hiraganaMap.put("せ", "se");
        hiraganaMap.put("そ", "so");
        hiraganaMap.put("た", "ta");
        hiraganaMap.put("ち", "chi");
        hiraganaMap.put("つ", "tsu");
        hiraganaMap.put("て", "te");
        hiraganaMap.put("と", "to");
        hiraganaMap.put("な", "na");
        hiraganaMap.put("に", "ni");
        hiraganaMap.put("ぬ", "nu");
        hiraganaMap.put("ね", "ne");
        hiraganaMap.put("の", "no");
        hiraganaMap.put("は", "ha");
        hiraganaMap.put("ひ", "hi");
        hiraganaMap.put("ふ", "fu");
        hiraganaMap.put("へ", "he");
        hiraganaMap.put("ほ", "ho");
        hiraganaMap.put("ま", "ma");
        hiraganaMap.put("み", "mi");
        hiraganaMap.put("む", "mu");
        hiraganaMap.put("め", "me");
        hiraganaMap.put("も", "mo");
        hiraganaMap.put("や", "ya");
        hiraganaMap.put("ゆ", "yu");
        hiraganaMap.put("よ", "yo");
        hiraganaMap.put("ら", "ra");
        hiraganaMap.put("り", "ri");
        hiraganaMap.put("る", "ru");
        hiraganaMap.put("れ", "re");
        hiraganaMap.put("ろ", "ro");
        hiraganaMap.put("わ", "wa");
        hiraganaMap.put("を", "wo");
        hiraganaMap.put("ん", "n");

        hiraganaMap.put("が", "ga");
        hiraganaMap.put("ぎ", "gi");
        hiraganaMap.put("ぐ", "gu");
        hiraganaMap.put("げ", "ge");
        hiraganaMap.put("ご", "go");
        hiraganaMap.put("ざ", "za");
        hiraganaMap.put("じ", "ji");
        hiraganaMap.put("ず", "zu");
        hiraganaMap.put("ぜ", "ze");
        hiraganaMap.put("ぞ", "zo");
        hiraganaMap.put("だ", "da");
        hiraganaMap.put("ぢ", "di");
        hiraganaMap.put("づ", "du");
        hiraganaMap.put("で", "de");
        hiraganaMap.put("ど", "do");
        hiraganaMap.put("ば", "ba");
        hiraganaMap.put("び", "bi");
        hiraganaMap.put("ぶ", "bu");
        hiraganaMap.put("べ", "be");
        hiraganaMap.put("ぼ", "bo");
        hiraganaMap.put("ぱ", "pa");
        hiraganaMap.put("ぴ", "pi");
        hiraganaMap.put("ぷ", "pu");
        hiraganaMap.put("ぺ", "pe");
        hiraganaMap.put("ぽ", "po");

        hiraganaMap.put("っ", "");

        String normalized = Normalizer.normalize(kana, Normalizer.Form.NFC);
        StringBuilder result = new StringBuilder();
        int i = 0;
        while (i < normalized.length()) {
            boolean matched = false;
            for (Map.Entry<String, String> entry : hiraganaMap.entrySet()) {
                if (normalized.substring(i).startsWith(entry.getKey())) {
                    result.append(entry.getValue());
                    i += entry.getKey().length();
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                result.append(normalized.charAt(i));
                i++;
            }
        }

        return result.toString();
    }

    public record ImportResult(int imported, int skipped, int failed, long durationMs) {}
}
