package com.midori.service;

import com.midori.dto.homeworkdto.ManualHomeworkRequest;
import com.midori.entity.ManualHomework;
import com.midori.entity.Homework;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ManualHomeworkService {

    ManualHomework createManualHomework(UUID teacherId, ManualHomeworkRequest request);

    ManualHomework updateManualHomework(UUID teacherId, UUID id, ManualHomeworkRequest request);

    ManualHomework getManualHomework(UUID teacherId, UUID id);

    List<ManualHomework> getManualHomeworksByTeacher(UUID teacherId);

    void deleteManualHomework(UUID teacherId, UUID id);

    ManualHomework publishManualHomework(UUID teacherId, UUID id);

    ManualHomework publishManualHomework(UUID teacherId, UUID id, UUID classId, Instant dueDate);

    ManualHomework draftManualHomework(UUID teacherId, UUID id);

    ManualHomework duplicateManualHomework(UUID teacherId, UUID id);

    Homework copyToHomework(UUID manualHomeworkId, UUID classId, Instant dueDate, UUID teacherId);
}
