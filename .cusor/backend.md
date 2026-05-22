Context: @midori-be/

# Backend Architecture Rules (Spring Boot)

- **Modular Architecture:** Tổ chức theo module tính năng. Mỗi module bao gồm:
  - `controller/`: Chỉ xử lý HTTP request/response, mapping endpoint. Không chứa logic.
  - `service/`: Chứa toàn bộ business logic. Đây là nơi duy nhất xử lý nghiệp vụ.
  - `repository/`: Tương tác trực tiếp với Database (Spring Data JPA).
  - `dto/`: Data Transfer Objects. Dùng để truyền nhận dữ liệu giữa Client và Server.
  - `entity/`: Các lớp ánh xạ trực tiếp với bảng trong cơ sở dữ liệu.
- **Controller Rules:** Controller phải "thin" (mỏng). Chỉ nhận input, gọi service, và trả về ResponseEntity.
- **Dependency Injection:** Luôn sử dụng **Constructor Injection** thay cho `@Autowired` ở field.
- **DTO Usage:** Không bao giờ trả về trực tiếp `entity` cho Client. Luôn chuyển đổi sang `dto` trong tầng service hoặc mapper.
- **API Naming:** Tuân thủ RESTful API naming conventions (ví dụ: `GET /api/v1/users`, `POST /api/v1/products`).
- **Clean Code & SOLID:**
  - Áp dụng Single Responsibility Principle (mỗi class chỉ làm một việc).
  - Xử lý Exception tập trung (dùng `@ControllerAdvice`).
  - Sử dụng `@Valid` để validate dữ liệu từ client ngay tại tầng DTO.
- **Naming:** - Class: PascalCase.
  - Method/Variable: camelCase.
  - Package: lowercase.