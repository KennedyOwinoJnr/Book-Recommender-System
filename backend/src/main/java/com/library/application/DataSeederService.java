package com.library.application;

import com.library.domain.Role;
import com.library.domain.User;
import com.library.infrastructure.BookRepository;
import com.library.infrastructure.RoleRepository;
import com.library.infrastructure.UserRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.*;

@Service
public class DataSeederService implements CommandLineRunner {
    private static final Logger logger = LoggerFactory.getLogger(DataSeederService.class);

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.csv-data-path}")
    private String csvDataPath;

    @Value("${app.initial-admin.email}")
    private String adminEmail;

    @Value("${app.initial-admin.password}")
    private String adminPassword;

    public DataSeederService(BookRepository bookRepository, UserRepository userRepository,
                             RoleRepository roleRepository, PasswordEncoder passwordEncoder,
                             JdbcTemplate jdbcTemplate) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        seedRolesAndAdmin();
        if (bookRepository.count() == 0) {
            logger.info("Database is empty. Starting CSV database seeding from {}...", csvDataPath);
            try {
                seedData();
            } catch (Exception e) {
                logger.error("Error seeding data from CSV files", e);
            }
        } else {
            logger.info("Database already contains data. Skipping CSV import.");
        }
    }

    private void seedRolesAndAdmin() {
        // Double check roles are seeded
        Role superAdminRole = roleRepository.findByName("ROLE_SUPER_ADMIN").orElseGet(() -> 
            roleRepository.save(Role.builder().name("ROLE_SUPER_ADMIN").build())
        );
        roleRepository.findByName("ROLE_ADMIN").orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_ADMIN").build()));
        roleRepository.findByName("ROLE_LIBRARIAN").orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_LIBRARIAN").build()));
        roleRepository.findByName("ROLE_MEMBER").orElseGet(() -> roleRepository.save(Role.builder().name("ROLE_MEMBER").build()));

        // Check if admin user exists
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .username("admin")
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .firstName("Super")
                    .lastName("Admin")
                    .emailVerified(true)
                    .isActive(true)
                    .roles(Set.of(superAdminRole))
                    .build();
            userRepository.save(admin);
            logger.info("Default SUPER_ADMIN user created with email: {}", adminEmail);
        }
    }

    private void seedData() throws IOException {
        long startTime = System.currentTimeMillis();

        File booksFile = new File(csvDataPath, "Books.csv");
        File apiBooksFile = new File(csvDataPath, "apibooks.csv");
        File usersFile = new File(csvDataPath, "Users.csv");
        File ratingsFile = new File(csvDataPath, "Ratings.csv");

        if (!booksFile.exists() || !usersFile.exists() || !ratingsFile.exists()) {
            logger.error("Seeding failed: Core CSV files (Books.csv, Users.csv, Ratings.csv) missing in folder {}", csvDataPath);
            return;
        }

        // 1. Read apibooks.csv into memory index for enrichment
        Map<String, ApiBookDetails> apiDetails = new HashMap<>();
        if (apiBooksFile.exists()) {
            logger.info("Reading apibooks.csv for metadata enrichment...");
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(apiBooksFile), StandardCharsets.UTF_8));
                 CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {
                for (CSVRecord record : csvParser) {
                    String isbn10 = record.get("join_isbn_10");
                    if (isbn10 != null && !isbn10.trim().isEmpty()) {
                        String description = record.isMapped("description") ? record.get("description") : null;
                        String pageCountStr = record.isMapped("page_count") ? record.get("page_count") : null;
                        String categories = record.isMapped("categories") ? record.get("categories") : null;
                        String maturity = record.isMapped("maturity_rating") ? record.get("maturity_rating") : null;
                        String lang = record.isMapped("language") ? record.get("language") : null;
                        
                        Integer pc = null;
                        if (pageCountStr != null && !pageCountStr.isEmpty()) {
                            try {
                                pc = (int) Double.parseDouble(pageCountStr);
                            } catch (NumberFormatException e) {
                                // ignore
                            }
                        }
                        
                        apiDetails.put(isbn10.trim(), new ApiBookDetails(description, pc, categories, maturity, lang));
                    }
                }
            }
            logger.info("Loaded {} enriched api book metadata entries.", apiDetails.size());
        }

        // 2. Load books
        logger.info("Importing books from Books.csv...");
        String insertBookSql = "INSERT INTO books (isbn, title, author, publisher, year_of_publication, image_url_small, image_url_medium, image_url_large, description, page_count, language, maturity_rating, stock_total, stock_available) " +
                               "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 5, 5) ON CONFLICT (isbn) DO NOTHING";
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(booksFile), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {
            
            List<Object[]> batchArgs = new ArrayList<>();
            int count = 0;

            for (CSVRecord record : csvParser) {
                String isbn = record.get("ISBN");
                String title = record.get("Book-Title");
                String author = record.get("Book-Author");
                String publisher = record.get("Publisher");
                String yearStr = record.get("Year-Of-Publication");
                String imgS = record.get("Image-URL-S");
                String imgM = record.get("Image-URL-M");
                String imgL = record.get("Image-URL-L");

                int year = 0;
                try {
                    year = Integer.parseInt(yearStr);
                } catch (NumberFormatException e) {
                    // ignore
                }

                ApiBookDetails details = apiDetails.get(isbn);
                String desc = details != null ? details.description : null;
                Integer pc = details != null ? details.pageCount : null;
                String lang = details != null ? details.language : "en";
                String maturity = details != null ? details.maturityRating : "NOT_MATURE";

                batchArgs.add(new Object[]{isbn, title, author, publisher, year, imgS, imgM, imgL, desc, pc, lang, maturity});
                count++;

                if (batchArgs.size() >= 5000) {
                    jdbcTemplate.batchUpdate(insertBookSql, batchArgs);
                    batchArgs.clear();
                    logger.info("Books imported: {}", count);
                }
                
                // Cap import size to 100k books to prevent system disk space / memory issues on local machines
                if (count >= 100000) {
                    break;
                }
            }
            if (!batchArgs.isEmpty()) {
                jdbcTemplate.batchUpdate(insertBookSql, batchArgs);
            }
            logger.info("Total books imported: {}", count);
        }

        // 3. Load users
        logger.info("Importing users from Users.csv...");
        String insertUserSql = "INSERT INTO users (username, email, password_hash, location, age, email_verified, is_active) VALUES (?, ?, ?, ?, ?, true, true) ON CONFLICT DO NOTHING";
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(usersFile), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {
            
            List<Object[]> batchArgs = new ArrayList<>();
            int count = 0;
            String defaultPass = passwordEncoder.encode("Password@123");

            for (CSVRecord record : csvParser) {
                String userId = record.get("User-ID");
                String location = record.get("Location");
                String ageStr = record.get("Age");

                Integer age = null;
                if (ageStr != null && !ageStr.isEmpty() && !"NULL".equalsIgnoreCase(ageStr)) {
                    try {
                        age = (int) Double.parseDouble(ageStr);
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }

                String username = "user_" + userId;
                String email = "user_" + userId + "@tomrec-library.com";

                batchArgs.add(new Object[]{username, email, defaultPass, location, age});
                count++;

                if (batchArgs.size() >= 5000) {
                    jdbcTemplate.batchUpdate(insertUserSql, batchArgs);
                    batchArgs.clear();
                    logger.info("Users imported: {}", count);
                }

                // Cap import size to 25k users
                if (count >= 25000) {
                    break;
                }
            }
            if (!batchArgs.isEmpty()) {
                jdbcTemplate.batchUpdate(insertUserSql, batchArgs);
            }
            logger.info("Total users imported: {}", count);
        }

        // Map ROLE_MEMBER to all seeded users
        logger.info("Mapping role 'ROLE_MEMBER' to imported users...");
        jdbcTemplate.execute(
            "INSERT INTO user_roles (user_id, role_id) " +
            "SELECT u.id, r.id FROM users u, roles r " +
            "WHERE r.name = 'ROLE_MEMBER' " +
            "AND u.username LIKE 'user_%' " +
            "ON CONFLICT DO NOTHING"
        );

        // 4. Load ratings
        logger.info("Importing ratings from Ratings.csv...");
        String insertRatingSql = "INSERT INTO book_ratings (user_id, book_id, rating) " +
                                 "SELECT u.id, b.id, ? FROM users u, books b " +
                                 "WHERE u.username = ? AND b.isbn = ? " +
                                 "ON CONFLICT (user_id, book_id) DO NOTHING";
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(ratingsFile), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {
            
            List<Object[]> batchArgs = new ArrayList<>();
            int count = 0;
            int skipped = 0;

            for (CSVRecord record : csvParser) {
                String userId = record.get("User-ID");
                String isbn = record.get("ISBN");
                String ratingStr = record.get("Book-Rating");

                int rating = 0;
                try {
                    rating = Integer.parseInt(ratingStr);
                } catch (NumberFormatException e) {
                    // ignore
                }

                String username = "user_" + userId;
                batchArgs.add(new Object[]{rating, username, isbn});
                count++;

                if (batchArgs.size() >= 2000) {
                    // Using direct execution on statement array to prevent issues
                    jdbcTemplate.batchUpdate(insertRatingSql, batchArgs);
                    batchArgs.clear();
                    logger.info("Ratings processed: {}", count);
                }

                // Cap ratings import to 50k to keep the local setup fast and lightweight
                if (count >= 50000) {
                    break;
                }
            }
            if (!batchArgs.isEmpty()) {
                jdbcTemplate.batchUpdate(insertRatingSql, batchArgs);
            }
            logger.info("Total ratings processed: {}", count);
        }

        long duration = System.currentTimeMillis() - startTime;
        logger.info("Database seeding successfully completed in {} ms.", duration);
    }

    private static class ApiBookDetails {
        String description;
        Integer pageCount;
        String categories;
        String maturityRating;
        String language;

        ApiBookDetails(String description, Integer pageCount, String categories, String maturityRating, String language) {
            this.description = description;
            this.pageCount = pageCount;
            this.categories = categories;
            this.maturityRating = maturityRating;
            this.language = language;
        }
    }
}
