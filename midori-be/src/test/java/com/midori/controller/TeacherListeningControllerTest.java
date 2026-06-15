package com.midori.controller;

import com.midori.common.ApiResponse;
import com.midori.dto.listening.*;
import com.midori.security.CustomUserDetails;
import com.midori.service.ListeningService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TeacherListeningControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ListeningService listeningService;

    @InjectMocks
    private TeacherListeningController teacherListeningController;

    private String level;
    private UUID teacherId;
    private ListeningDetailResponse mockResponse;
    private CustomUserDetails mockUserDetails;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        level = "N3";
        teacherId = UUID.randomUUID();

        mockUserDetails = CustomUserDetails.builder()
                .id(teacherId)
                .email("teacher@example.com")
                .role("TEACHER")
                .status("ACTIVE")
                .build();

        mockResponse = ListeningDetailResponse.builder()
                .id(UUID.randomUUID())
                .level(level)
                .teacherId(teacherId)
                .teacherName("Test Teacher")
                .title("Test Listening Lesson")
                .audioUrl("/uploads/mock-audio.mp3")
                .audioFileName("mock-audio.mp3")
                .audioType("audio/mpeg")
                .status("PENDING")
                .build();

        mockMvc = MockMvcBuilders.standaloneSetup(teacherListeningController)
                .setCustomArgumentResolvers(new HandlerMethodArgumentResolver() {
                    @Override
                    public boolean supportsParameter(MethodParameter parameter) {
                        return parameter.getParameterType().equals(CustomUserDetails.class);
                    }

                    @Override
                    public Object resolveArgument(MethodParameter parameter,
                                                  ModelAndViewContainer mavContainer,
                                                  NativeWebRequest webRequest,
                                                  WebDataBinderFactory binderFactory) {
                        return mockUserDetails;
                    }
                }).build();
    }

    @Test
    @DisplayName("should create listening lesson successfully with audio file")
    void createListening_success() throws Exception {
        MockMultipartFile audioFile = new MockMultipartFile(
                "audioFile",
                "test.mp3",
                "audio/mpeg",
                "audio-content".getBytes()
        );

        when(listeningService.createListening(any(CreateListeningRequest.class), any()))
                .thenReturn(mockResponse);

        mockMvc.perform(multipart("/api/teacher/listenings")
                        .file(audioFile)
                        .param("level", level)
                        .param("title", "Test Listening Lesson")
                        .contentType(MediaType.MULTIPART_FORM_DATA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Test Listening Lesson")))
                .andExpect(jsonPath("$.data.audioUrl", is("/uploads/mock-audio.mp3")));
    }
}
