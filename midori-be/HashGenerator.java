import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "MidoriAdmin2026!";
        String hash = encoder.encode(password);
        System.out.println("Hash: " + hash);
    }
}
