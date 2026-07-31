package com.midori;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MidoriBeApplication {
    public static void main(String[] args) {
        SpringApplication.run(MidoriBeApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.boot.CommandLineRunner deleteArchivedClassesRunner(
            com.midori.repository.ClassRepository classRepository,
            com.midori.repository.UserRepository userRepository,
            com.midori.repository.ExamRepository examRepository,
            com.midori.repository.HomeworkRepository homeworkRepository,
            org.springframework.transaction.support.TransactionTemplate transactionTemplate) {
        return args -> {
            transactionTemplate.execute(status -> {
                java.util.List<com.midori.entity.ClassEntity> classes = classRepository.findAll();
                int count = 0;
                for (com.midori.entity.ClassEntity c : classes) {
                    if (c.getStatus() == com.midori.entity.ClassEntity.ClassStatus.ARCHIVED) {
                        java.util.List<com.midori.entity.User> students = new java.util.ArrayList<>(c.getStudents());
                        for (com.midori.entity.User student : students) {
                            student.getAssignedClasses().remove(c);
                            userRepository.save(student);
                        }
                        c.getStudents().clear();
                        
                        java.util.List<com.midori.entity.Exam> exams = examRepository.findByAssignedClassId(c.getId());
                        if (!exams.isEmpty()) {
                            examRepository.deleteAll(exams);
                        }
                
                        java.util.List<com.midori.entity.Homework> homeworks = homeworkRepository.findByAssignedClassId(c.getId());
                        if (!homeworks.isEmpty()) {
                            homeworkRepository.deleteAll(homeworks);
                        }
                        
                        classRepository.delete(c);
                        count++;
                    }
                }
                System.out.println("========== DELETED " + count + " ARCHIVED CLASSES ==========");
                return null;
            });
        };
    }
}
