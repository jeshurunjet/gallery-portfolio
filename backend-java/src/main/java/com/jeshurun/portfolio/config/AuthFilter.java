package com.jeshurun.portfolio.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class AuthFilter extends OncePerRequestFilter {

    private static final String VALID_TOKEN = "dev-admin-token";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Allow public routes
        if (path.startsWith("/api/auth") ||
            path.startsWith("/uploads") ||
            (request.getMethod().equals("GET") &&
             (path.startsWith("/api/projects") || path.startsWith("/api/tags")))) {

            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.equals("Bearer " + VALID_TOKEN)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Unauthorized");
            return;
        }

        filterChain.doFilter(request, response);
    }
}