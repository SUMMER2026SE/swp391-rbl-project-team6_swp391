package com.midori.service;

import com.midori.dto.classdto.StudentImportResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

public interface StudentImportService {
    StudentImportResponse importStudents(UUID classId, MultipartFile file, UUID teacherId);
    byte[] generateTemplate();
}
