package com.library.infrastructure;

import com.library.domain.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    Optional<Book> findByIsbn(String isbn);
    boolean existsByIsbn(String isbn);

    // Eagerly fetches categories in a single JOIN to avoid LazyInitializationException
    @Query("SELECT b FROM Book b LEFT JOIN FETCH b.categories WHERE b.id = :id")
    Optional<Book> findByIdWithCategories(@Param("id") Long id);

    // Eagerly fetches categories in a single JOIN to avoid LazyInitializationException
    @Query("SELECT b FROM Book b LEFT JOIN FETCH b.categories WHERE b.isbn = :isbn")
    Optional<Book> findByIsbnWithCategories(@Param("isbn") String isbn);

    // EntityGraph causes Hibernate to batch-load categories for all books on the page
    // in one extra SELECT rather than N+1 lazy fetches
    @EntityGraph(attributePaths = "categories")
    @Query(value = "SELECT b FROM Book b WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%'))",
           countQuery = "SELECT count(b) FROM Book b WHERE LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Book> searchBooks(@Param("query") String query, Pageable pageable);

    @EntityGraph(attributePaths = "categories")
    @Query(value = "SELECT b FROM Book b JOIN b.categories c WHERE c.name = :categoryName",
           countQuery = "SELECT count(b) FROM Book b JOIN b.categories c WHERE c.name = :categoryName")
    Page<Book> findByCategory(@Param("categoryName") String categoryName, Pageable pageable);

    @EntityGraph(attributePaths = "categories")
    @Query(value = "SELECT b FROM Book b JOIN b.categories c WHERE (LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%'))) AND c.name = :categoryName",
           countQuery = "SELECT count(b) FROM Book b JOIN b.categories c WHERE (LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%'))) AND c.name = :categoryName")
    Page<Book> searchByCategory(@Param("query") String query, @Param("categoryName") String categoryName, Pageable pageable);

    // Override findAll(Pageable) with EntityGraph so the default browse also fetches categories
    @Override
    @EntityGraph(attributePaths = "categories")
    Page<Book> findAll(Pageable pageable);
}
