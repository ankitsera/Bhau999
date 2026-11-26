package com.matka.backend.controller;

import com.matka.backend.ActiveGame;
import com.matka.backend.Game;
import com.matka.backend.repository.ActiveGameRepository;
import com.matka.backend.repository.BetRepository;
import com.matka.backend.repository.GameRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GameControllerTest {

    // In-memory stand-ins for the game and active_games tables.
    private final Map<String, Game> games = new HashMap<>();
    private final Map<String, ActiveGame> activeGames = new HashMap<>();

    private final GameRepository gameRepository = mock(GameRepository.class);
    private final ActiveGameRepository activeGameRepository = mock(ActiveGameRepository.class);
    private final GameController controller = new GameController();

    GameControllerTest() {
        when(gameRepository.existsById(anyString())).thenAnswer(inv -> games.containsKey(inv.<String>getArgument(0)));
        when(gameRepository.findById(anyString())).thenAnswer(inv -> Optional.ofNullable(games.get(inv.<String>getArgument(0))));
        when(gameRepository.save(any(Game.class))).thenAnswer(inv -> {
            Game g = inv.getArgument(0);
            games.put(g.getName(), g);
            return g;
        });
        when(activeGameRepository.existsById(anyString())).thenAnswer(inv -> activeGames.containsKey(inv.<String>getArgument(0)));
        when(activeGameRepository.save(any(ActiveGame.class))).thenAnswer(inv -> {
            ActiveGame ag = inv.getArgument(0);
            activeGames.put(ag.getGameName(), ag);
            return ag;
        });
        org.mockito.Mockito.doAnswer(inv -> activeGames.remove(inv.<String>getArgument(0)))
                .when(activeGameRepository).deleteById(anyString());

        ReflectionTestUtils.setField(controller, "gameRepository", gameRepository);
        ReflectionTestUtils.setField(controller, "activeGameRepository", activeGameRepository);
        ReflectionTestUtils.setField(controller, "betRepository", mock(BetRepository.class));
    }

    // What the admin panel's "Add game" dialog sends (no "enabled" field).
    private static Game addGameRequest(String name) {
        Game g = new Game();
        g.setName(name);
        g.setOpenTime(LocalTime.of(10, 0));
        g.setCloseTime(LocalTime.of(11, 0));
        g.setSaturday(true);
        g.setSunday(true);
        return g;
    }

    @Test
    void newGameIsAddedToTheLiveList() {
        controller.createOrUpdate(addGameRequest("fresh game"));

        assertThat(games.get("FRESH GAME").getEnabled()).isTrue();
        assertThat(activeGames).containsKey("FRESH GAME");
    }

    @Test
    void reAddingADeletedGameBringsItBack() {
        // Admin "Delete" only disables the game and removes it from the live list.
        controller.createOrUpdate(addGameRequest("test"));
        controller.setEnabled("TEST", Map.of("enabled", false));
        assertThat(activeGames).doesNotContainKey("TEST");

        // Adding a game with the same name again must make it visible in the app.
        controller.createOrUpdate(addGameRequest("test"));

        assertThat(games.get("TEST").getEnabled()).isTrue();
        assertThat(activeGames).containsKey("TEST");
    }

    @Test
    void reEnablingAGameAddsItBackToTheLiveList() {
        controller.createOrUpdate(addGameRequest("test"));
        controller.setEnabled("TEST", Map.of("enabled", false));

        controller.setEnabled("TEST", Map.of("enabled", true));

        assertThat(activeGames).containsKey("TEST");
    }

    @Test
    void editingAnEnabledGameKeepsItsTodayState() {
        controller.createOrUpdate(addGameRequest("test"));
        activeGames.get("TEST").setOpenPana(123); // result already declared today

        Game edit = addGameRequest("test");
        edit.setCloseTime(LocalTime.of(12, 0));
        controller.createOrUpdate(edit);

        assertThat(activeGames.get("TEST").getOpenPana()).isEqualTo(123);
        assertThat(games.get("TEST").getCloseTime()).isEqualTo(LocalTime.of(12, 0));
    }

    @Test
    void explicitlyDisabledSaveStaysDisabled() {
        Game g = addGameRequest("hidden");
        g.setEnabled(false);
        controller.createOrUpdate(g);

        assertThat(games.get("HIDDEN").getEnabled()).isFalse();
        assertThat(activeGames).doesNotContainKey("HIDDEN");
    }

    @Test
    void timesAcrossTheTwoAmResetAreRejected() {
        Game g = addGameRequest("broken");
        g.setOpenTime(LocalTime.of(0, 45));
        g.setCloseTime(LocalTime.of(10, 0));

        var res = controller.createOrUpdate(g);

        assertThat(res.getStatusCode().value()).isEqualTo(400);
        assertThat(games).doesNotContainKey("BROKEN");
        assertThat(activeGames).doesNotContainKey("BROKEN");
    }
}
