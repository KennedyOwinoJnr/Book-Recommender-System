package com.library.application;

import com.library.domain.Book;
import com.library.domain.BookRating;
import com.library.domain.Category;
import com.library.domain.User;
import com.library.infrastructure.BookRatingRepository;
import com.library.infrastructure.BookRepository;
import com.library.infrastructure.CategoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final BookRatingRepository ratingRepository;
    private final AuditLogService auditLogService;

    public BookService(BookRepository bookRepository, CategoryRepository categoryRepository,
                       BookRatingRepository ratingRepository, AuditLogService auditLogService) {
        this.bookRepository = bookRepository;
        this.categoryRepository = categoryRepository;
        this.ratingRepository = ratingRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public Page<Book> getBooks(String query, String category, Pageable pageable) {
        if (query != null && !query.trim().isEmpty() && category != null && !category.trim().isEmpty()) {
            return bookRepository.searchByCategory(query.trim(), category.trim(), pageable);
        } else if (query != null && !query.trim().isEmpty()) {
            return bookRepository.searchBooks(query.trim(), pageable);
        } else if (category != null && !category.trim().isEmpty()) {
            return bookRepository.findByCategory(category.trim(), pageable);
        }
        return bookRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Book getBookById(Long id) {
        return bookRepository.findByIdWithCategories(id)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public Book getBookByIsbn(String isbn) {
        return bookRepository.findByIsbnWithCategories(isbn)
                .orElseThrow(() -> new IllegalArgumentException("Book not found with isbn: " + isbn));
    }

    @Transactional
    public Book createBook(Book bookData, List<String> categories, Long actorId, String actorEmail) {
        if (bookRepository.existsByIsbn(bookData.getIsbn())) {
            throw new IllegalArgumentException("Book with ISBN " + bookData.getIsbn() + " already exists.");
        }

        Set<Category> categorySet = resolveCategories(categories);
        bookData.setCategories(categorySet);

        Book saved = bookRepository.save(bookData);
        auditLogService.log(actorId, actorEmail, "BOOK_CREATE", "Book", saved.getId(), 
                "Book created: " + saved.getTitle() + " (ISBN: " + saved.getIsbn() + ")");
        return saved;
    }

    @Transactional
    public Book updateBook(Long id, Book bookData, List<String> categories, Long actorId, String actorEmail) {
        Book existing = getBookById(id);
        
        existing.setTitle(bookData.getTitle());
        existing.setAuthor(bookData.getAuthor());
        existing.setPublisher(bookData.getPublisher());
        existing.setYearOfPublication(bookData.getYearOfPublication());
        existing.setDescription(bookData.getDescription());
        existing.setPageCount(bookData.getPageCount());
        existing.setLanguage(bookData.getLanguage());
        existing.setMaturityRating(bookData.getMaturityRating());
        existing.setImageUrlSmall(bookData.getImageUrlSmall());
        existing.setImageUrlMedium(bookData.getImageUrlMedium());
        existing.setImageUrlLarge(bookData.getImageUrlLarge());
        existing.setStockTotal(bookData.getStockTotal());
        
        // Adjust stock available based on changes to total stock
        int difference = bookData.getStockTotal() - existing.getStockTotal();
        existing.setStockAvailable(Math.max(0, existing.getStockAvailable() + difference));

        if (categories != null) {
            Set<Category> categorySet = resolveCategories(categories);
            existing.setCategories(categorySet);
        }

        Book updated = bookRepository.save(existing);
        auditLogService.log(actorId, actorEmail, "BOOK_UPDATE", "Book", updated.getId(), 
                "Book updated: " + updated.getTitle());
        return updated;
    }

    @Transactional
    public void deleteBook(Long id, Long actorId, String actorEmail) {
        Book book = getBookById(id);
        bookRepository.delete(book);
        auditLogService.log(actorId, actorEmail, "BOOK_DELETE", "Book", id, 
                "Book deleted: " + book.getTitle() + " (ISBN: " + book.getIsbn() + ")");
    }

    @Transactional
    public BookRating rateBook(User user, Long bookId, Integer score) {
        if (score < 0 || score > 10) {
            throw new IllegalArgumentException("Rating score must be between 0 and 10.");
        }
        Book book = getBookById(bookId);

        BookRating rating = ratingRepository.findByUserIdAndBookId(user.getId(), bookId)
                .orElse(BookRating.builder().user(user).book(book).build());

        rating.setRating(score);
        BookRating saved = ratingRepository.save(rating);
        
        auditLogService.log(user.getId(), user.getEmail(), "BOOK_RATE", "Book", book.getId(), 
                "Rated book with score " + score);
        return saved;
    }

    @Transactional(readOnly = true)
    public Double getBookAverageRating(Long bookId) {
        return ratingRepository.getAverageRating(bookId);
    }

    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    private Set<Category> resolveCategories(List<String> categoryNames) {
        if (categoryNames == null) return new HashSet<>();
        return categoryNames.stream().map(name -> {
            String trimmed = name.trim();
            return categoryRepository.findByName(trimmed)
                    .orElseGet(() -> categoryRepository.save(Category.builder().name(trimmed).build()));
        }).collect(Collectors.toSet());
    }
}
