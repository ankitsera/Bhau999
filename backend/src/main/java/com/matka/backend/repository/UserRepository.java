package com.matka.backend.repository;

import com.matka.backend.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByMobileNumber(String mobileNumber);

    List<User> findByMobileNumberIn(Collection<String> mobileNumbers);

    List<User> findByFcmTokenIn(Collection<String> fcmTokens);
}
