package com.matka.backend.service;

import com.matka.backend.User;
import com.matka.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * The single place a user's balance is persisted.
 *
 * Every balance write in the app goes through {@link #saveAndNotify}, so there is
 * exactly one spot that has to remember to tell the device something changed. Adding
 * a new balance-changing feature therefore cannot silently skip the push.
 */
@Service
public class BalanceService {
    private static final Logger log = LoggerFactory.getLogger(BalanceService.class);

    private final UserRepository userRepository;
    private final BalanceNotificationService balanceNotificationService;

    /**
     * Users touched by the transaction running on this thread. Collected rather than
     * pushed immediately so that a result declaration crediting 2000 winners sends one
     * batch instead of 2000 separate messages.
     */
    private final ThreadLocal<Set<String>> pending = ThreadLocal.withInitial(LinkedHashSet::new);

    @Autowired
    public BalanceService(UserRepository userRepository,
                          BalanceNotificationService balanceNotificationService) {
        this.userRepository = userRepository;
        this.balanceNotificationService = balanceNotificationService;
    }

    /**
     * Persist a user whose balance was just changed, and arrange for the device to be
     * told once the surrounding transaction actually commits.
     *
     * @param reason short label for the log, e.g. "Bet won" or "Deposit credited"
     */
    public User saveAndNotify(User user, String reason) {
        User saved = userRepository.save(user);
        notifyBalanceChanged(saved.getMobileNumber(), reason);
        return saved;
    }

    /**
     * Queue a balance-changed push for a user.
     *
     * The push fires only AFTER the transaction commits. Sending inside the transaction
     * would let us announce money that a later rollback takes away - the client would
     * fetch, see the old number, and look broken.
     */
    public void notifyBalanceChanged(String mobileNumber, String reason) {
        if (mobileNumber == null || mobileNumber.isBlank()) return;

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            // No transaction in play (e.g. a plain repository save) - nothing to wait for.
            log.debug("Balance changed for {} ({}), pushing immediately", mobileNumber, reason);
            balanceNotificationService.pushBalanceChanged(Set.of(mobileNumber));
            return;
        }

        Set<String> batch = pending.get();
        boolean firstForThisTransaction = batch.isEmpty();
        batch.add(mobileNumber);

        if (!firstForThisTransaction) return;

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                Set<String> toPush = new LinkedHashSet<>(pending.get());
                if (toPush.isEmpty()) return;
                log.info("Balance changed for {} user(s) ({}), pushing", toPush.size(), reason);
                balanceNotificationService.pushBalanceChanged(toPush);
            }

            @Override
            public void afterCompletion(int status) {
                // Always clear, including on rollback, so a pooled thread does not carry
                // stale entries into the next request.
                pending.remove();
            }
        });
    }
}
