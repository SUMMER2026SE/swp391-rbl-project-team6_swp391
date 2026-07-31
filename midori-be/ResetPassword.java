import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;

public class ResetPassword {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
        String user = "postgres.clyuyvdaoprxrpmrcyhd";
        String pass = "Midori@2026#DbStrong!";
        
        String hash = "$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGTRNywSnJMmOe3PW"; // 123456
        
        try (Connection conn = DriverManager.getConnection(url, user, pass)) {
            String sql = "UPDATE users SET password_hash = ? WHERE email = 'ngan29102005@gmail.com'";
            try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setString(1, hash);
                int rows = pstmt.executeUpdate();
                System.out.println("Updated " + rows + " rows.");
            }
        }
    }
}
