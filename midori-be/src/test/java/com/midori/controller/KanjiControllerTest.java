package com.midori.controller;

import com.midori.dto.kanji.KanjiResponse;
import com.midori.exception.ResourceNotFoundException;
import com.midori.service.KanjiService;
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

import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = KanjiController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.midori\\.security\\..*|com\\.midori\\.config\\..*"
    )
)
@AutoConfigureMockMvc(addFilters = false)
class KanjiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KanjiService kanjiService;

    @Nested
    @DisplayName("GET /api/kanji/{kanji}")
    class GetKanji {

        @Test
        @DisplayName("should return kanji info successfully when character exists")
        void getKanji_success() throws Exception {
            KanjiResponse mockResponse = KanjiResponse.builder()
                    .character("食")
                    .onyomi("ショク")
                    .kunyomi("たべる")
                    .strokeCount(9)
                    .radical("184")
                    .jlpt("N5")
                    .meaning("eat")
                    .build();

            when(kanjiService.getKanjiInfo("食")).thenReturn(mockResponse);

            mockMvc.perform(get("/api/kanji/食"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.character", is("食")))
                    .andExpect(jsonPath("$.data.onyomi", is("ショク")))
                    .andExpect(jsonPath("$.data.kunyomi", is("たべる")));

            verify(kanjiService).getKanjiInfo("食");
        }

        @Test
        @DisplayName("should return 404 not found when kanji does not exist")
        void getKanji_notFound() throws Exception {
            when(kanjiService.getKanjiInfo("unknown"))
                    .thenThrow(new ResourceNotFoundException("KanjiEntry", "character", "unknown"));

            mockMvc.perform(get("/api/kanji/unknown"))
                    .andExpect(status().isNotFound());

            verify(kanjiService).getKanjiInfo("unknown");
        }
    }
}
