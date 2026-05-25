package com.jeshurun.portfolio.config;

import com.jeshurun.portfolio.security.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import com.jeshurun.portfolio.repository.UserRepository;
import com.jeshurun.portfolio.entity.User;

import java.io.IOException;
import java.util.Collections;

public class AuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
private final UserRepository userRepository;

    public AuthFilter(JwtService jwtService, UserRepository userRepository) {
    this.jwtService = jwtService;
    this.userRepository = userRepository;
}

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        System.out.println("AuthFilter path: " + path + " method: " + request.getMethod());

        // Allow public routes
        if (path.startsWith("/api/auth/login") ||
        path.startsWith("/api/auth/register") ||
        path.startsWith("/api/auth/forgot") ||
        path.startsWith("/api/auth/reset") ||
        path.startsWith("/uploads") ||
        path.matches("/api/projects/\\d+/view") ||
        path.matches("/api/projects/\\d+/like") ||
        (request.getMethod().equals("GET") &&
                (path.startsWith("/api/projects") ||
                        path.startsWith("/api/tags") ||
                        path.startsWith("/api/pages")))) {
    filterChain.doFilter(request, response);
    return;
}

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Missing token");
            return;
        }

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.getWriter().write("Invalid token");
    return;
}

String email = jwtService.extractEmail(token);

User user = userRepository.findByEmail(email).orElse(null);

if (user == null) {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.getWriter().write("User not found");
    return;
}

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        user.getEmail(),
                        null,
                        Collections.emptyList()
                );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        request.setAttribute("user", user);

        filterChain.doFilter(request, response);
    }
}
