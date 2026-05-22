Context: @midori/

# Frontend Architecture Rules (React)

- **Architecture:** Feature-based folder structure (vd: `features/auth/`, `features/cart/`).
- **Components:** - Chia tách rõ ràng giữa:
  - `components/`: UI components thuần túy (presentational/dumb).
  - `features/*/components/`: Components chứa logic nghiệp vụ đặc thù cho tính năng.
- **State Management:** - Ưu tiên `useState`/`useReducer` cho state cục bộ.
  - Sử dụng `React Query (TanStack Query)` cho việc gọi và quản lý cache dữ liệu từ API.
  - Sử dụng Context API hoặc state management (Zustand/Redux) cho state toàn cục.
- **Hooks:** - Đưa toàn bộ logic xử lý dữ liệu vào custom hooks (vd: `useAuth`, `useProducts`).
  - Page components chỉ gọi các custom hooks và render UI.
- **API:** Sử dụng `axios` instance với `interceptors` để xử lý header/token.
- **TypeScript & Props:** - Luôn định nghĩa interface cho `props` của components.
  - Sử dụng strict types cho các response từ API.
- **Performance:** - Sử dụng `React.memo`, `useMemo`, `useCallback` khi cần thiết để tối ưu render.
  - Tuân thủ nguyên tắc "lifting state up" khi cần chia sẻ dữ liệu.
- **Naming:** - Components: PascalCase (vd: `UserProfile.tsx`).
  - Hooks: camelCase bắt đầu bằng 'use' (vd: `useFetchData.ts`).
