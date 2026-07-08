package com.midori.service;

import com.midori.dto.classdto.AdminClassResponse;
import java.util.List;
import java.util.UUID;

public interface AdminClassService {
    List<AdminClassResponse> getAdminClasses();
    AdminClassResponse getAdminClassById(UUID id);
}
