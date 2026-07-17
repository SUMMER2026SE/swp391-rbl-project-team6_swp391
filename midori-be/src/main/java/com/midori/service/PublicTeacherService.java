package com.midori.service;

import com.midori.dto.response.PublicTeacherResponse;
import java.util.List;
import java.util.UUID;

public interface PublicTeacherService {
    List<PublicTeacherResponse> getActiveTeachers();
    PublicTeacherResponse getTeacherDetail(UUID teacherId);
}
