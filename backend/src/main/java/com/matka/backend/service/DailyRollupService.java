package com.matka.backend.service;

import com.matka.backend.ActiveGame;
import com.matka.backend.Bet;
import com.matka.backend.Game;
import com.matka.backend.GameHistory;
import com.matka.backend.repository.ActiveGameRepository;
import com.matka.backend.repository.BetHistoryRepository;
import com.matka.backend.repository.BetRepository;
import com.matka.backend.repository.GameHistoryRepository;
import com.matka.backend.repository.GameRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import com.matka.backend.repository.NotificationRepository;
import com.matka.backend.repository.PropertiesRepository;
import java.time.LocalDateTime;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Daily roll-up job that runs at 02:00 server time every day.
 * - Moves all rows from active_games -> game_history with yesterday's date
 * - Re-populates active_games from game table with null open/close
 * - Moves all rows from bets -> bets_history with yesterday's date
 * - Empties bets table
 */
@Component
public class DailyRollupService {
    private static final Logger log = LoggerFactory.getLogger(DailyRollupService.class);

    @Autowired
    private ActiveGameRepository activeGameRepository;

    @Autowired
    private GameHistoryRepository gameHistoryRepository;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private BetRepository betRepository;

    @Autowired
    private BetHistoryRepository betHistoryRepository;

    @Autowired
    private PropertiesRepository propertiesRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    // Cron: second minute hour day month weekday -> 0 0 2 * * *  -> 02:00 every day
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void runDailyRollup() {
        log.info("Starting daily rollup job");
        LocalDate yesterday = LocalDate.now().minusDays(1);

        try {
            // 1) Move active games to game_history
            List<ActiveGame> activeList = activeGameRepository.findAll();
            if (!activeList.isEmpty()) {
                List<GameHistory> ghList = new ArrayList<>();
                for (ActiveGame ag : activeList) {
                    GameHistory gh = new GameHistory();
                    gh.setGameName(ag.getGameName());
                    gh.setHistDate(yesterday);
                    gh.setOpenPana(ag.getOpenPana());
                    gh.setClosePana(ag.getClosePana());
                    ghList.add(gh);
                }
                gameHistoryRepository.saveAll(ghList);
                log.info("Moved {} active games to game_history for date={}", ghList.size(), yesterday);
            } else {
                log.info("No active games to move to history");
            }

            // 2) Clear active_games and repopulate from game table
            activeGameRepository.deleteAll();
            List<Game> games = gameRepository.findAll();
            List<ActiveGame> newActive = new ArrayList<>();
            java.time.DayOfWeek todayDow = java.time.LocalDate.now().getDayOfWeek();
            boolean isSat = todayDow == java.time.DayOfWeek.SATURDAY;
            boolean isSun = todayDow == java.time.DayOfWeek.SUNDAY;
            for (Game g : games) {
                // Skip games that are explicitly disabled
                if (Boolean.FALSE.equals(g.getEnabled())) {
                    log.info("Skipping disabled game '{}' when repopulating active_games", g.getName());
                    continue;
                }

                ActiveGame ag = new ActiveGame();
                ag.setGameName(g.getName());
                ag.setOpenPana(null);
                ag.setClosePana(null);
                // determine runningToday: if weekend and game not enabled for that day, set false
                if (isSat) {
                    ag.setRunningToday(Boolean.TRUE.equals(g.getSaturday()));
                } else if (isSun) {
                    ag.setRunningToday(Boolean.TRUE.equals(g.getSunday()));
                } else {
                    ag.setRunningToday(true);
                }
                newActive.add(ag);
            }
            if (!newActive.isEmpty()) {
                activeGameRepository.saveAll(newActive);
                log.info("Repopulated active_games with {} games (today is {} )", newActive.size(), todayDow);
            } else {
                log.info("No games found in game table to populate active_games for day={}", todayDow);
            }

            // 3) Move bets to bets_history with yesterday's date
            List<Bet> bets = betRepository.findAll();
            if (!bets.isEmpty()) {
                List<com.matka.backend.BetHistory> bhList = new ArrayList<>();
                for (Bet b : bets) {
                    com.matka.backend.BetHistory bh = new com.matka.backend.BetHistory();
                    bh.setMobileNumber(b.getMobileNumber());
                    bh.setGameName(b.getGameName());
                    // preserve type/amount/betValue/openClose and betTime/result in the copied row
                    bh.setType(b.getType());
                    bh.setAmount(b.getAmount());
                    bh.setWinAmount(b.getWinAmount());
                    bh.setBetValue(b.getBetValue());
                    bh.setOpenClose(b.getOpenClose());
                    bh.setBetTime(b.getBetTime());
                    bh.setResult(b.getResult());
                    bhList.add(bh);
                }
                betHistoryRepository.saveAll(bhList);
                log.info("Moved {} bets to bets_history for date={}", bhList.size(), yesterday);

                // 4) Clear bets table
                betRepository.deleteAll();
                log.info("Cleared bets table after moving to history");
            } else {
                log.info("No bets to move to history");
            }
            // 5) Cleanup old notifications according to properties.save_notification_for_days (default 7 days)
            try {
                int keepDays = 7;
                try {
                    var p = propertiesRepository.findById("save_notification_for_days");
                    if (p.isPresent()) {
                        String v = p.get().getValue();
                        if (v != null && !v.isBlank()) {
                            keepDays = Integer.parseInt(v.trim());
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Unable to read save_notification_for_days property, defaulting to 7 days", ex);
                }

                LocalDateTime cutoff = LocalDateTime.now().minusDays(keepDays);
                notificationRepository.deleteByDatetimeBefore(cutoff);
                log.info("Deleted notifications older than {} days (cutoff={})", keepDays, cutoff);
            } catch (Exception ex) {
                log.warn("Failed to cleanup old notifications: {}", ex.getMessage());
            }
            // 6) Reset today_withdrawls to true for the new day
            try {
                var p = propertiesRepository.findById("today_withdrawls");
                if (p.isPresent()) {
                    p.get().setValue("true");
                    propertiesRepository.save(p.get());
                    log.info("Reset today_withdrawls to true");
                }
            } catch (Exception ex) {
                log.warn("Failed to reset today_withdrawls property: {}", ex.getMessage());
            }

            log.info("Daily rollup job completed successfully");
        } catch (Exception ex) {
            log.error("Daily rollup job failed", ex);
            // let transaction roll back
            throw ex;
        }
    }
}
