package com.midori.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface SpeechToTextService {

    SpeechRecognitionResult transcribe(MultipartFile audioFile) throws IOException;
}
