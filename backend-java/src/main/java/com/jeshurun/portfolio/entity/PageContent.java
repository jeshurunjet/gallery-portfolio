package com.jeshurun.portfolio.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "page_content")
public class PageContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "page_key", unique = true, nullable = false)
    private String pageKey;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    public PageContent() {}

    public PageContent(String pageKey, String content) {
        this.pageKey = pageKey;
        this.content = content;
    }

    public Long getId() {
        return id;
    }

    public String getPageKey() {
        return pageKey;
    }

    public void setPageKey(String pageKey) {
        this.pageKey = pageKey;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
