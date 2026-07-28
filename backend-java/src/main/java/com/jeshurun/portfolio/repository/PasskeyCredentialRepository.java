package com.jeshurun.portfolio.repository;

import com.jeshurun.portfolio.entity.PasskeyCredential;
import com.jeshurun.portfolio.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasskeyCredentialRepository extends JpaRepository<PasskeyCredential, Long> {
    List<PasskeyCredential> findAllByUser(User user);
    Optional<PasskeyCredential> findByCredentialId(String credentialId);
    List<PasskeyCredential> findAllByUserHandle(String userHandle);
    long countByUser(User user);
    void deleteAllByUser(User user);
}
