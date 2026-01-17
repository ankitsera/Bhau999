package com.matka.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import com.matka.backend.repository.BetRepository;
import com.matka.backend.repository.TransactionRepository;
import com.matka.backend.repository.UserRepository;
import com.matka.backend.repository.RateRepository;
import com.matka.backend.Bet;
import com.matka.backend.TransactionEntity;
import com.matka.backend.User;
import com.matka.backend.Rate;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class BetProcessingService {
    private final BetRepository betRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final RateRepository rateRepository;
    private final Logger logger = LoggerFactory.getLogger(BetProcessingService.class);

    @Autowired
    public BetProcessingService(BetRepository betRepository,
                                TransactionRepository transactionRepository,
                                UserRepository userRepository,
                                RateRepository rateRepository) {
        this.betRepository = betRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.rateRepository = rateRepository;
    }

    @Transactional
    public void processBetsForResult(String gameName, String openClose, Integer result) {
        try {
            List<Bet> bets = betRepository.findByGameNameAndOpenClose(gameName, openClose);
            if (bets == null || bets.isEmpty()) return;

            java.util.List<Bet> toSave = new java.util.ArrayList<>();
            for (Bet b : bets) {
                String type = b.getType() == null ? "" : b.getType().toLowerCase();
                Integer betVal = b.getBetValue();
                boolean won = false;

                if (type.contains("pana")) {
                    if (betVal != null && result != null && betVal.equals(result)) {
                        won = true;
                    }
                } else if (type.contains("ank")) {
                    if (betVal != null && result != null) {
                        int tmp = Math.abs(result);
                        int sum = 0;
                        while (tmp > 0) { sum += tmp % 10; tmp /= 10; }
                        int units = sum % 10;
                        if (betVal == units) won = true;
                    }
                } else {
                    // default to Lost for unhandled types
                    won = false;
                }

                b.setResult(won ? "Won" : "Lost");
                toSave.add(b);

                // If bet won, create transaction and credit user balance
                if (won) {
                    try {
                        double rateVal = 1.0;
                        if (b.getType() != null) {
                            java.util.Optional<Rate> ro = rateRepository.findById(b.getType());
                            if (ro.isPresent() && ro.get().getRate() != null) rateVal = ro.get().getRate();
                        }
                        int payout = (int) Math.round((b.getAmount() == null ? 0 : b.getAmount()) * rateVal);

                        TransactionEntity tx = new TransactionEntity();
                        tx.setMobileNumber(b.getMobileNumber());
                        tx.setAmount(payout);
                        tx.setTxDate(LocalDate.now());
                        tx.setTxTime(LocalTime.now());
                        tx.setInitiator("Bet won");

                        transactionRepository.save(tx);

                        // credit user balance
                        java.util.Optional<User> uo = userRepository.findByMobileNumber(b.getMobileNumber());
                        if (uo.isPresent()) {
                            User u = uo.get();
                            Integer bal = u.getBalance() == null ? 0 : u.getBalance();
                            u.setBalance(bal + payout);
                            userRepository.save(u);
                        }
                    } catch (Exception ex) {
                        logger.error("Error creating payout transaction for bet id " + b.getId(), ex);
                    }
                }
            }

            if (!toSave.isEmpty()) {
                betRepository.saveAll(toSave);
            }
        } catch (Exception e) {
            logger.error("Error processing bets for result", e);
        }
    }
}
