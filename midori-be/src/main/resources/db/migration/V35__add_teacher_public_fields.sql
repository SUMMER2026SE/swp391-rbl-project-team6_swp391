-- Thêm các trường cho giảng viên vào bảng user_profiles
ALTER TABLE user_profiles
ADD COLUMN professional_title VARCHAR(255),
ADD COLUMN teaching_levels VARCHAR(255),
ADD COLUMN specializations VARCHAR(255),
ADD COLUMN years_of_experience INT;
