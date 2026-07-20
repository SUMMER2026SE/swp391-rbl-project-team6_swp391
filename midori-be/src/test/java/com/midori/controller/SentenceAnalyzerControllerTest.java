package com.midori.controller;

import com.midori.dto.tokenizer.JapaneseTokenResponse;
import com.midori.service.JapaneseTokenizerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = SentenceAnalyzerController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.midori\\.security\\..*|com\\.midori\\.config\\..*"
    )
)
@AutoConfigureMockMvc(addFilters = false)
class SentenceAnalyzerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JapaneseTokenizerService tokenizerService;

    @Nested
    @DisplayName("GET /api/dictionary/analyze")
    class GetAnalyze {

        @Test
        @DisplayName("should analyze sentence and return mapped tokens converting katakana reading to hiragana")
        void analyze_success() throws Exception {
            JapaneseTokenResponse t1 = JapaneseTokenResponse.builder()
                    .surface("昨日")
                    .lemma("昨日")
                    .reading("キノウ") // Katakana reading from Sudachi
                    .partOfSpeech("noun")
                    .characterOffset(0)
                    .build();

            JapaneseTokenResponse t2 = JapaneseTokenResponse.builder()
                    .surface("へ")
                    .lemma("へ")
                    .reading("ヘ")
                    .partOfSpeech("particle")
                    .characterOffset(2)
                    .build();

            when(tokenizerService.tokenize("昨日へ")).thenReturn(List.of(t1, t2));

            mockMvc.perform(get("/api/dictionary/analyze").param("sentence", "昨日へ"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    // "昨日": noun, katakana reading "キノウ" converted to hiragana "きのう"
                    .andExpect(jsonPath("$.data[0].surface", is("昨日")))
                    .andExpect(jsonPath("$.data[0].lemma", is("昨日")))
                    .andExpect(jsonPath("$.data[0].reading", is("きのう")))
                    .andExpect(jsonPath("$.data[0].pos", is("noun")))
                    // "へ": particle, lemma and reading should be null/excluded
                    .andExpect(jsonPath("$.data[1].surface", is("へ")))
                    .andExpect(jsonPath("$.data[1].lemma").doesNotExist())
                    .andExpect(jsonPath("$.data[1].reading").doesNotExist())
                    .andExpect(jsonPath("$.data[1].pos", is("particle")));

            verify(tokenizerService).tokenize("昨日へ");
        }

        @Test
        @DisplayName("should return 400 bad request when sentence parameter is blank")
        void analyze_blankSentence() throws Exception {
            mockMvc.perform(get("/api/dictionary/analyze").param("sentence", "   "))
                    .andExpect(status().isBadRequest());

            verify(tokenizerService, never()).tokenize(anyString());
        }
    }
}
