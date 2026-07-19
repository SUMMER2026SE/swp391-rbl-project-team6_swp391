package com.midori.controller;

import com.midori.dto.dictionary.DictionaryHoverResponse;
import com.midori.exception.ResourceNotFoundException;
import com.midori.service.DictionaryHoverService;
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

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = DictionaryHoverController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.midori\\.security\\..*|com\\.midori\\.config\\..*"
    )
)
@AutoConfigureMockMvc(addFilters = false)
class DictionaryHoverControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DictionaryHoverService hoverService;

    @Nested
    @DisplayName("GET /api/dictionary/hover")
    class GetHoverInfo {

        @Test
        @DisplayName("should return hover info successfully when word exists")
        void getHoverInfo_success() throws Exception {
            DictionaryHoverResponse mockResponse = DictionaryHoverResponse.builder()
                    .word("食べる")
                    .reading("たべる")
                    .romaji("taberu")
                    .partOfSpeech("verb")
                    .meanings(List.of("to eat", "to consume"))
                    .build();

            when(hoverService.getHoverInfo("食べる")).thenReturn(mockResponse);

            mockMvc.perform(get("/api/dictionary/hover").param("word", "食べる"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.word", is("食べる")))
                    .andExpect(jsonPath("$.data.reading", is("たべる")))
                    .andExpect(jsonPath("$.data.romaji", is("taberu")))
                    .andExpect(jsonPath("$.data.meanings[0]", is("to eat")));

            verify(hoverService).getHoverInfo("食べる");
        }

        @Test
        @DisplayName("should return 400 bad request when word parameter is blank")
        void getHoverInfo_blankWord() throws Exception {
            mockMvc.perform(get("/api/dictionary/hover").param("word", "   "))
                    .andExpect(status().isBadRequest());

            verify(hoverService, never()).getHoverInfo(anyString());
        }

        @Test
        @DisplayName("should return 400 bad request when word parameter is missing")
        void getHoverInfo_missingWord() throws Exception {
            mockMvc.perform(get("/api/dictionary/hover"))
                    .andExpect(status().isBadRequest());

            verify(hoverService, never()).getHoverInfo(anyString());
        }

        @Test
        @DisplayName("should return 404 not found when word is not in dictionary")
        void getHoverInfo_notFound() throws Exception {
            when(hoverService.getHoverInfo("unknown"))
                    .thenThrow(new ResourceNotFoundException("DictionaryEntry", "word", "unknown"));

            mockMvc.perform(get("/api/dictionary/hover").param("word", "unknown"))
                    .andExpect(status().isNotFound());

            verify(hoverService).getHoverInfo("unknown");
        }
    }
}
