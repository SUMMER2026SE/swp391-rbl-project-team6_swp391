package com.midori.controller;

import com.midori.dto.dictionary.DictionaryDetailResponse;
import com.midori.exception.ResourceNotFoundException;
import com.midori.service.DictionaryDetailService;
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

import java.util.Collections;

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = DictionaryDetailController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.midori\\.security\\..*|com\\.midori\\.config\\..*"
    )
)
@AutoConfigureMockMvc(addFilters = false)
class DictionaryDetailControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DictionaryDetailService detailService;

    @Nested
    @DisplayName("GET /api/dictionary/detail")
    class GetDetail {

        @Test
        @DisplayName("should return detail successfully when word exists")
        void getDetail_success() throws Exception {
            DictionaryDetailResponse mockResponse = DictionaryDetailResponse.builder()
                    .word("食べる")
                    .reading("たべる")
                    .romaji("taberu")
                    .jlpt("N5")
                    .frequency(100)
                    .partOfSpeech("verb")
                    .meanings(Collections.emptyList())
                    .examples(Collections.emptyList())
                    .relatedWords(Collections.emptyList())
                    .build();

            when(detailService.getDetail("食べる")).thenReturn(mockResponse);

            mockMvc.perform(get("/api/dictionary/detail").param("word", "食べる"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.word", is("食べる")))
                    .andExpect(jsonPath("$.data.reading", is("たべる")))
                    .andExpect(jsonPath("$.data.jlpt", is("N5")));

            verify(detailService).getDetail("食べる");
        }

        @Test
        @DisplayName("should return 400 bad request when word parameter is blank")
        void getDetail_blankWord() throws Exception {
            mockMvc.perform(get("/api/dictionary/detail").param("word", "   "))
                    .andExpect(status().isBadRequest());

            verify(detailService, never()).getDetail(anyString());
        }

        @Test
        @DisplayName("should return 400 bad request when word parameter is missing")
        void getDetail_missingWord() throws Exception {
            mockMvc.perform(get("/api/dictionary/detail"))
                    .andExpect(status().isBadRequest());

            verify(detailService, never()).getDetail(anyString());
        }

        @Test
        @DisplayName("should return 404 not found when word is not in dictionary")
        void getDetail_notFound() throws Exception {
            when(detailService.getDetail("unknown"))
                    .thenThrow(new ResourceNotFoundException("DictionaryEntry", "word", "unknown"));

            mockMvc.perform(get("/api/dictionary/detail").param("word", "unknown"))
                    .andExpect(status().isNotFound());

            verify(detailService).getDetail("unknown");
        }
    }
}
