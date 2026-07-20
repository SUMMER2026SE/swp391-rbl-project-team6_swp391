package com.midori.controller;

import com.midori.dto.dictionary.DictionaryAutocompleteResponse;
import com.midori.dto.dictionary.DictionaryEntryResponse;
import com.midori.service.DictionarySearchService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = DictionarySearchController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.midori\\.security\\..*|com\\.midori\\.config\\..*"
    )
)
@AutoConfigureMockMvc(addFilters = false)
class DictionarySearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DictionarySearchService searchService;

    @Nested
    @DisplayName("GET /api/dictionary/search")
    class GetSearch {

        @Test
        @DisplayName("should search entries successfully with pagination and sorting")
        void search_success() throws Exception {
            DictionaryEntryResponse entryResponse = DictionaryEntryResponse.builder()
                    .surface("食べる")
                    .reading("たべる")
                    .romaji("taberu")
                    .build();

            PageRequest pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "frequency"));
            PageImpl<DictionaryEntryResponse> page = new PageImpl<>(List.of(entryResponse), pageable, 1);

            when(searchService.search("食べる", pageable)).thenReturn(page);

            mockMvc.perform(get("/api/dictionary/search")
                            .param("query", "食べる")
                            .param("page", "0")
                            .param("size", "20")
                            .param("sortBy", "frequency")
                            .param("sortDir", "desc"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data.content", hasSize(1)))
                    .andExpect(jsonPath("$.data.content[0].surface", is("食べる")));

            verify(searchService).search("食べる", pageable);
        }

        @Test
        @DisplayName("should return autocomplete suggestions successfully")
        void search_autocompleteSuccess() throws Exception {
            DictionaryAutocompleteResponse suggestion = DictionaryAutocompleteResponse.builder()
                    .word("食べる")
                    .reading("たべる")
                    .romaji("taberu")
                    .build();

            when(searchService.autocomplete("tabe")).thenReturn(List.of(suggestion));

            mockMvc.perform(get("/api/dictionary/search")
                            .param("query", "tabe")
                            .param("autocomplete", "true"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success", is(true)))
                    .andExpect(jsonPath("$.data", hasSize(1)))
                    .andExpect(jsonPath("$.data[0].word", is("食べる")));

            verify(searchService).autocomplete("tabe");
        }

        @Test
        @DisplayName("should return 400 bad request when query parameter is blank")
        void search_blankQuery() throws Exception {
            mockMvc.perform(get("/api/dictionary/search").param("query", "   "))
                    .andExpect(status().isBadRequest());

            verify(searchService, never()).search(anyString(), any());
        }

        @Test
        @DisplayName("should return 400 bad request when page is negative")
        void search_negativePage() throws Exception {
            mockMvc.perform(get("/api/dictionary/search")
                            .param("query", "食べる")
                            .param("page", "-1"))
                    .andExpect(status().isBadRequest());

            verify(searchService, never()).search(anyString(), any());
        }

        @Test
        @DisplayName("should return 400 bad request when size is zero or negative")
        void search_invalidSize() throws Exception {
            mockMvc.perform(get("/api/dictionary/search")
                            .param("query", "食べる")
                            .param("size", "0"))
                    .andExpect(status().isBadRequest());

            verify(searchService, never()).search(anyString(), any());
        }
    }
}
