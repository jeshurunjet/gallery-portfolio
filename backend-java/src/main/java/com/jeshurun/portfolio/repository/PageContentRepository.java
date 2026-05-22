package com.jeshurun.portfolio.repository;

import com.jeshurun.portfolio.entity.PageContent;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PageContentRepository extends JpaRepository<PageContent, Long> {
    Optional<PageContent> findByPageKey(String pageKey);
}
