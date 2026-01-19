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
import com.matka.backend.ActiveGame;
import com.matka.backend.repository.ActiveGameRepository;
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
    private final ActiveGameRepository activeGameRepository;
    private final Logger logger = LoggerFactory.getLogger(BetProcessingService.class);

    @Autowired
    public BetProcessingService(BetRepository betRepository,
                                TransactionRepository transactionRepository,
                                UserRepository userRepository,
                                RateRepository rateRepository,
                                ActiveGameRepository activeGameRepository) {
        this.betRepository = betRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.rateRepository = rateRepository;
        this.activeGameRepository = activeGameRepository;
    }

    @Transactional
    public void processBetsForResult(String gameName, String openClose, Integer result) {
        try {
            List<Bet> bets = betRepository.findByGameNameAndOpenClose(gameName, openClose);
            if (bets == null || bets.isEmpty()) return;

            java.util.List<Bet> toSave = new java.util.ArrayList<>();
            for (Bet b : bets) {
                String type = b.getType() == null ? "" : b.getType().toLowerCase();
                String betVal = b.getBetValue();
                boolean won = false;

                if (type.contains("pana")) {
                    if (betVal != null && result != null && betVal.equals(String.valueOf(result))) {
                        won = true;
                    }
                } else if (type.contains("digit")) {
                    if (betVal != null && result != null) {
                        try {
                            int bv = Integer.parseInt(betVal.trim());
                            int tmp = Math.abs(result);
                            int sum = 0;
                            while (tmp > 0) { sum += tmp % 10; tmp /= 10; }
                            int units = sum % 10;
                            if (bv == units) won = true;
                        } catch (NumberFormatException nfe) {
                            // invalid bet value, treat as lost
                        }
                    }
                } else if (type.contains("jodi")) {
                    // betVal expected to be two digits e.g. "34" -> left=3, right=4
                    if (betVal != null && betVal.length() >= 2 && result != null) {
                        try {
                            String v = betVal.trim();
                            // take last two characters if longer than 2
                            if (v.length() > 2) v = v.substring(v.length() - 2);
                            char leftCh = v.charAt(0);
                            char rightCh = v.charAt(1);
                            int rightDigit = Character.getNumericValue(rightCh);

                            // right matches result in 'digit' fashion
                            int tmp = Math.abs(result);
                            int sum = 0;
                            while (tmp > 0) { sum += tmp % 10; tmp /= 10; }
                            int resultUnits = sum % 10;
                            boolean rightMatch = (rightDigit == resultUnits);

                            // left matches active game's open in 'digit' fashion
                            boolean leftMatch = false;
                            java.util.Optional<ActiveGame> aopt = activeGameRepository.findById(gameName);
                            if (aopt.isPresent() && aopt.get().getOpenPana() != null) {
                                int openVal = Math.abs(aopt.get().getOpenPana());
                                int tsum = 0; while (openVal > 0) { tsum += openVal % 10; openVal /= 10; }
                                int openUnits = tsum % 10;
                                int leftDigit = Character.getNumericValue(leftCh);
                                leftMatch = (leftDigit == openUnits);
                            }

                            if (leftMatch && rightMatch) won = true;
                        } catch (Exception ex) {
                            // treat as lost on any parse/error
                        }
                    }
                } else if (type.contains("full")) {
                    // betVal expected like "12-125" (left-right)
                    if (betVal != null && betVal.contains("-") && result != null) {
                        try {
                            String[] parts = betVal.split("-", 2);
                            String left = parts[0].trim();
                            String right = parts[1].trim();

                            // right match with result (pana style)
                            boolean rightMatch = right.equals(String.valueOf(result));

                            // left match with active game's open (pana style)
                            boolean leftMatch = false;
                            java.util.Optional<ActiveGame> aopt = activeGameRepository.findById(gameName);
                            if (aopt.isPresent() && aopt.get().getOpenPana() != null) {
                                leftMatch = left.equals(String.valueOf(aopt.get().getOpenPana()));
                            }

                            if (leftMatch && rightMatch) won = true;
                        } catch (Exception ex) {
                            // lost on error
                        }
                    }
                } else {
                    // generic hyphen case: split and determine which side is single-digit
                    if (betVal != null && betVal.contains("-") && result != null) {
                        try {
                            String[] parts = betVal.split("-", 2);
                            String left = parts[0].trim();
                            String right = parts[1].trim();

                            boolean leftIsSingle = left.length() == 1;
                            boolean rightIsSingle = right.length() == 1;

                            java.util.Optional<ActiveGame> aopt = activeGameRepository.findById(gameName);
                            Integer openPana = aopt.isPresent() ? aopt.get().getOpenPana() : null;

                            boolean leftMatch = false;
                            boolean rightMatch = false;

                            if (leftIsSingle && openPana != null) {
                                // left in digit fashion to open
                                try {
                                    int leftDigit = Integer.parseInt(left);
                                    int tmp = Math.abs(openPana);
                                    int sum = 0; while (tmp > 0) { sum += tmp % 10; tmp /= 10; }
                                    int openUnits = sum % 10;
                                    leftMatch = (leftDigit == openUnits);
                                } catch (NumberFormatException nfe) {
                                    leftMatch = false;
                                }
                            } else if (!leftIsSingle && openPana != null) {
                                // left in pana fashion to open
                                leftMatch = left.equals(String.valueOf(openPana));
                            }

                            if (rightIsSingle) {
                                try {
                                    int rightDigit = Integer.parseInt(right);
                                    int tmp = Math.abs(result);
                                    int sum = 0; while (tmp > 0) { sum += tmp % 10; tmp /= 10; }
                                    int resultUnits = sum % 10;
                                    rightMatch = (rightDigit == resultUnits);
                                } catch (NumberFormatException nfe) {
                                    rightMatch = false;
                                }
                            } else {
                                // right in pana fashion to result
                                rightMatch = right.equals(String.valueOf(result));
                            }

                            if (leftMatch && rightMatch) won = true;
                        } catch (Exception ex) {
                            // lost on error
                        }
                    } else {
                        // cannot interpret betVal, default to lost
                        won = false;
                    }
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
