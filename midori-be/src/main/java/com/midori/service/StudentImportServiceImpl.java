package com.midori.service;

import com.midori.dto.classdto.StudentImportResponse;
import com.midori.dto.classdto.StudentImportResponse.ImportDetail;
import com.midori.dto.classdto.StudentImportResponse.ImportSummary;
import com.midori.entity.ClassEntity;
import com.midori.entity.ClassMembership;
import com.midori.entity.Role;
import com.midori.entity.User;
import com.midori.exception.AccessDeniedException;
import com.midori.exception.BadRequestException;
import com.midori.exception.ResourceNotFoundException;
import com.midori.repository.ClassMembershipRepository;
import com.midori.repository.ClassRepository;
import com.midori.repository.UserRepository;
import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentImportServiceImpl implements StudentImportService {

    private final ClassRepository classRepository;
    private final UserRepository userRepository;
    private final ClassMembershipRepository classMembershipRepository;
    private final PlatformTransactionManager transactionManager;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    @Override
    public StudentImportResponse importStudents(UUID classId, MultipartFile file, UUID teacherId) {
        // 1. Fetch class & authorize
        ClassEntity classEntity = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));

        if (!classEntity.getTeacher().getId().equals(teacherId)) {
            throw new AccessDeniedException("You do not have permission to manage this class");
        }

        if (classEntity.getStatus() != ClassEntity.ClassStatus.ACTIVE) {
            throw new BadRequestException("Class is archived and cannot accept new students");
        }

        // 2. Validate file metadata
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.toLowerCase().endsWith(".csv") && !filename.toLowerCase().endsWith(".xlsx"))) {
            throw new BadRequestException("Only CSV and XLSX files are supported");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("File size exceeds the 5MB limit");
        }

        List<RawRow> rawRows = new ArrayList<>();
        try {
            if (filename.toLowerCase().endsWith(".csv")) {
                rawRows = parseCsv(file.getInputStream());
            } else {
                rawRows = parseExcel(file.getInputStream());
            }
        } catch (Exception e) {
            log.error("Failed to parse file: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to read the file: " + e.getMessage());
        }

        if (rawRows.size() > 1000) {
            throw new BadRequestException("File contains " + rawRows.size() + " data rows, which exceeds the limit of 1000 rows");
        }

        // 3. Process rows
        int added = 0;
        int alreadyInClass = 0;
        int accountNotFound = 0;
        int invalidEmail = 0;
        int duplicateInFile = 0;

        Set<String> seenEmails = new HashSet<>();
        List<ImportDetail> details = new ArrayList<>();
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        for (RawRow row : rawRows) {
            String email = row.getEmail();
            int rowNum = row.getRowNum();

            if (email == null || email.trim().isEmpty()) {
                continue;
            }

            String cleanEmail = email.trim().toLowerCase();

            // Check Duplicate in File
            if (seenEmails.contains(cleanEmail)) {
                duplicateInFile++;
                details.add(new ImportDetail(rowNum, email, "DUPLICATE_IN_FILE", "Duplicate email in file"));
                continue;
            }
            seenEmails.add(cleanEmail);

            // Validate Email format
            if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
                invalidEmail++;
                details.add(new ImportDetail(rowNum, email, "INVALID_EMAIL", "Invalid email format"));
                continue;
            }

            // Find student
            Optional<User> studentOpt = userRepository.findByEmail(cleanEmail);
            if (studentOpt.isEmpty()) {
                accountNotFound++;
                details.add(new ImportDetail(rowNum, email, "ACCOUNT_NOT_FOUND", "Account not found"));
                continue;
            }

            User student = studentOpt.get();
            if (student.getRole() != Role.STUDENT) {
                accountNotFound++;
                details.add(new ImportDetail(rowNum, email, "ACCOUNT_NOT_FOUND", "User is not a student"));
                continue;
            }

            // Check class membership
            boolean isEnrolled = false;
            if (student.getAssignedClasses() != null) {
                for (ClassEntity c : student.getAssignedClasses()) {
                    if (c.getId().equals(classId)) {
                        isEnrolled = true;
                        break;
                    }
                }
            }

            if (isEnrolled) {
                alreadyInClass++;
                details.add(new ImportDetail(rowNum, email, "ALREADY_IN_CLASS", "Student is already in this class"));
                continue;
            }

            // Enroll Student in a separate transaction
            try {
                final User finalStudent = student;
                Boolean enrolled = transactionTemplate.execute(status -> {
                    // Refetch entities inside transaction
                    ClassEntity txClass = classRepository.findById(classId).orElse(null);
                    User txStudent = userRepository.findById(finalStudent.getId()).orElse(null);

                    if (txClass == null || txStudent == null) {
                        return false;
                    }

                    if (txClass.getStudents().size() >= txClass.getMaxStudents()) {
                        throw new IllegalStateException("Class is full");
                    }

                    if (txStudent.getAssignedClasses() == null) {
                        txStudent.setAssignedClasses(new HashSet<>());
                    }
                    txStudent.getAssignedClasses().add(txClass);
                    userRepository.save(txStudent);

                    ClassMembership membership = ClassMembership.builder()
                            .student(txStudent)
                            .classEntity(txClass)
                            .build();
                    classMembershipRepository.save(membership);
                    return true;
                });

                if (Boolean.TRUE.equals(enrolled)) {
                    added++;
                    details.add(new ImportDetail(rowNum, email, "SUCCESS", "Student added successfully"));
                } else {
                    accountNotFound++;
                    details.add(new ImportDetail(rowNum, email, "ACCOUNT_NOT_FOUND", "Failed to enroll student"));
                }

            } catch (IllegalStateException e) {
                details.add(new ImportDetail(rowNum, email, "FAILED", e.getMessage()));
            } catch (Exception e) {
                log.error("Error enrolling student {}: {}", cleanEmail, e.getMessage(), e);
                details.add(new ImportDetail(rowNum, email, "FAILED", "Internal error enrolling student"));
            }
        }

        ImportSummary summary = ImportSummary.builder()
                .total(rawRows.size())
                .added(added)
                .alreadyInClass(alreadyInClass)
                .accountNotFound(accountNotFound)
                .invalidEmail(invalidEmail)
                .duplicateInFile(duplicateInFile)
                .build();

        log.info("Student Import stats for class {}: total={}, added={}, alreadyInClass={}, accountNotFound={}, invalidEmail={}, duplicateInFile={}",
                classId, rawRows.size(), added, alreadyInClass, accountNotFound, invalidEmail, duplicateInFile);

        return StudentImportResponse.builder()
                .success(true)
                .summary(summary)
                .details(details)
                .build();
    }

    @Override
    public byte[] generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Template");

            Row header = sheet.createRow(0);
            Cell cell = header.createCell(0);
            cell.setCellValue("Email");

            // Apply bold style to header
            CellStyle style = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            style.setFont(font);
            cell.setCellStyle(style);

            // Add sample rows
            Row row1 = sheet.createRow(1);
            row1.createCell(0).setCellValue("student1@gmail.com");

            Row row2 = sheet.createRow(2);
            row2.createCell(0).setCellValue("student2@gmail.com");

            sheet.autoSizeColumn(0);

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate excel template", e);
            throw new RuntimeException("Failed to generate template", e);
        }
    }

    private List<RawRow> parseCsv(InputStream inputStream) throws Exception {
        List<RawRow> list = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            List<String[]> all = reader.readAll();
            if (all.isEmpty()) {
                return list;
            }

            // Determine email column
            String[] header = all.get(0);
            int emailCol = 0;
            for (int i = 0; i < header.length; i++) {
                if ("email".equalsIgnoreCase(header[i].trim())) {
                    emailCol = i;
                    break;
                }
            }

            for (int i = 1; i < all.size(); i++) {
                String[] row = all.get(i);
                if (row.length > emailCol) {
                    String val = row[emailCol];
                    if (val != null && !val.trim().isEmpty()) {
                        list.add(new RawRow(i + 1, val));
                    }
                }
            }
        }
        return list;
    }

    private List<RawRow> parseExcel(InputStream inputStream) throws Exception {
        List<RawRow> list = new ArrayList<>();
        try (Workbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0);
            int rowsCount = sheet.getLastRowNum();
            if (rowsCount < 0) {
                return list;
            }

            Row headerRow = sheet.getRow(0);
            int emailCol = 0;
            if (headerRow != null) {
                for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                    Cell cell = headerRow.getCell(i);
                    if (cell != null && cell.getCellType() == CellType.STRING) {
                        if ("email".equalsIgnoreCase(cell.getStringCellValue().trim())) {
                            emailCol = i;
                            break;
                        }
                    }
                }
            }

            DataFormatter formatter = new DataFormatter();
            for (int i = 1; i <= rowsCount; i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    Cell cell = row.getCell(emailCol);
                    if (cell != null) {
                        String val = formatter.formatCellValue(cell);
                        if (val != null && !val.trim().isEmpty()) {
                            list.add(new RawRow(i + 1, val));
                        }
                    }
                }
            }
        }
        return list;
    }

    private static class RawRow {
        private final int rowNum;
        private final String email;

        public RawRow(int rowNum, String email) {
            this.rowNum = rowNum;
            this.email = email;
        }

        public int getRowNum() {
            return rowNum;
        }

        public String getEmail() {
            return email;
        }
    }
}
