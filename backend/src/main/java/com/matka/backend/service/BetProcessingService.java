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
    private final BalanceService balanceService;
    private final Logger logger = LoggerFactory.getLogger(BetProcessingService.class);

    @Autowired
    public BetProcessingService(BetRepository betRepository,
                                TransactionRepository transactionRepository,
                                UserRepository userRepository,
                                RateRepository rateRepository,
                                ActiveGameRepository activeGameRepository,
                                BalanceService balanceService) {
        this.betRepository = betRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.rateRepository = rateRepository;
        this.activeGameRepository = activeGameRepository;
        this.balanceService = balanceService;
    }

    /**
     * Evaluate whether a bet is a winner for the given gameName and result.
     * This is a pure function (no DB writes).
     */
    private boolean isWinning(Bet b, String gameName, Integer result) {
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
            if (betVal != null && betVal.length() >= 2 && result != null) {
                try {
                    String v = betVal.trim();
                    if (v.length() > 2) v = v.substring(v.length() - 2);
                    char leftCh = v.charAt(0);
                    char rightCh = v.charAt(1);
                    int rightDigit = Character.getNumericValue(rightCh);

                    int tmp = Math.abs(result);
                    int sum = 0;
                    while (tmp > 0) { sum += tmp % 10; tmp /= 10; }
                    int resultUnits = sum % 10;
                    boolean rightMatch = (rightDigit == resultUnits);

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
            if (betVal != null && betVal.contains("-") && result != null) {
                try {
                    String[] parts = betVal.split("-", 2);
                    String left = parts[0].trim();
                    String right = parts[1].trim();

                    boolean rightMatch = right.equals(String.valueOf(result));

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
                        rightMatch = right.equals(String.valueOf(result));
                    }

                    if (leftMatch && rightMatch) won = true;
                } catch (Exception ex) {
                    // lost on error
                }
            } else {
                won = false;
            }
        }

        return won;
    }

    @Transactional(readOnly = true)
    public java.util.List<Bet> findWinningBets(String gameName, String openClose, Integer result) {
        java.util.List<Bet> out = new java.util.ArrayList<>();
        try {
            List<Bet> bets = betRepository.findByGameNameAndOpenClose(gameName, openClose);
            if (bets == null || bets.isEmpty()) return out;
            for (Bet b : bets) {
                if (isWinning(b, gameName, result)) {
                    out.add(b);
                }
            }
        } catch (Exception e) {
            logger.error("Error finding winning bets", e);
        }
        return out;
    }

    @Transactional
    public void processBetsForResult(String gameName, String openClose, Integer result) {
        try {
            List<Bet> bets = betRepository.findByGameNameAndOpenClose(gameName, openClose);
            if (bets == null || bets.isEmpty()) return;

            java.util.List<Bet> toSave = new java.util.ArrayList<>();
            for (Bet b : bets) {
                try {
                    boolean newWon = isWinning(b, gameName, result);
                    String prev = b.getResult();
                    boolean prevWasWon = prev != null && "Won".equalsIgnoreCase(prev);
                    boolean prevWasLost = prev != null && "Lost".equalsIgnoreCase(prev);

                    // Cases:
                    // prev=null -> set according to newWon; if won create payout
                    // prev=Won && newWon=false -> mark Lost, delete payout tx and deduct
                    // prev=Lost && newWon=true -> mark Won, create payout
                    // prev and new same -> nothing

                    if (prev == null) {
                        // first declaration
                        if (newWon) {
                            b.setResult("Won");
                            toSave.add(b);
                            int payout = computePayout(b);
                            createPayoutAndCreditUser(b, payout);
                        } else {
                            b.setResult("Lost");
                            toSave.add(b);
                        }
                    } else if (prevWasWon) {
                        if (!newWon) {
                            // previously won, now lost -> revert payout
                            b.setResult("Lost");
                            toSave.add(b);
                            int payout = computePayout(b);
                            // find most recent matching payout tx and delete it
                            java.util.List<TransactionEntity> txs = transactionRepository.findByMobileNumberAndAmountAndInitiatorOrderByIdDesc(
                                    b.getMobileNumber(), payout, "Bet won");
                            if (txs != null && !txs.isEmpty()) {
                                TransactionEntity tx = txs.get(0);
                                try {
                                    transactionRepository.delete(tx);
                                    // deduct user balance
                                    java.util.Optional<User> uo = userRepository.findByMobileNumber(b.getMobileNumber());
                                    if (uo.isPresent()) {
                                        User u = uo.get();
                                        Integer bal = u.getBalance() == null ? 0 : u.getBalance();
                                        int newBal = bal - payout;
                                        u.setBalance(newBal);
                                        balanceService.saveAndNotify(u, "Bet payout reverted");
                                        logger.info("Reverted payout for bet id {} mobile {}: deducted {}. Old balance: {}, New balance: {}",
                                                b.getId(), b.getMobileNumber(), payout, bal, newBal);
                                        // clear winAmount on the bet and persist
                                        try {
                                            b.setWinAmount(0);
                                            betRepository.save(b);
                                        } catch (Exception ex2) {
                                            logger.warn("Failed to clear winAmount for bet id {}", b.getId(), ex2);
                                        }
                                    } else {
                                        logger.warn("User with mobile {} not found to deduct payout of {} for bet id {}",
                                                b.getMobileNumber(), payout, b.getId());
                                    }
                                } catch (Exception ex) {
                                    logger.error("Error deleting payout transaction for bet id " + b.getId(), ex);
                                }
                            } else {
                                logger.warn("No matching payout transaction found to delete for mobile={} amount={}", b.getMobileNumber(), payout);
                            }
                        } // else still won -> nothing
                    } else if (prevWasLost) {
                        if (newWon) {
                            b.setResult("Won");
                            toSave.add(b);
                            int payout = computePayout(b);
                            createPayoutAndCreditUser(b, payout);
                        } // else still lost -> nothing
                    } else {
                        // unexpected prev value: overwrite with new
                        b.setResult(newWon ? "Won" : "Lost");
                        toSave.add(b);
                        if (newWon) {
                            int payout = computePayout(b);
                            createPayoutAndCreditUser(b, payout);
                        }
                    }
                } catch (Exception e) {
                    logger.error("Error processing individual bet id=" + b.getId(), e);
                }
            }

            if (!toSave.isEmpty()) {
                betRepository.saveAll(toSave);
            }
        } catch (Exception e) {
            logger.error("Error processing bets for result", e);
        }
    }

    private int computePayout(Bet b) {
        double rateVal = 1.0;
        if (b.getType() != null) {
            java.util.Optional<Rate> ro = rateRepository.findById(b.getType());
            if (ro.isPresent() && ro.get().getRate() != null) rateVal = ro.get().getRate();
        }
        int payout = (int) Math.round((b.getAmount() == null ? 0 : b.getAmount()) * rateVal);
        return payout;
    }

    private void createPayoutAndCreditUser(Bet b, int payout) {
        try {
            TransactionEntity tx = new TransactionEntity();
            tx.setMobileNumber(b.getMobileNumber());
            tx.setAmount(payout);
            tx.setTxDate(LocalDate.now());
            tx.setTxTime(LocalTime.now());
            tx.setInitiator("Bet won");

            transactionRepository.save(tx);

            java.util.Optional<User> uo = userRepository.findByMobileNumber(b.getMobileNumber());
            if (uo.isPresent()) {
                User u = uo.get();
                Integer bal = u.getBalance() == null ? 0 : u.getBalance();
                u.setBalance(bal + payout);
                balanceService.saveAndNotify(u, "Bet won");
                // record win amount on the bet and persist
                try {
                    b.setWinAmount(payout);
                    betRepository.save(b);
                } catch (Exception ex2) {
                    logger.warn("Failed to set winAmount for bet id {}", b.getId(), ex2);
                }
            }
        } catch (Exception ex) {
            logger.error("Error creating payout transaction for bet id " + b.getId(), ex);
        }
    }
}
