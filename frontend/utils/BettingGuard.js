//fetch allowed types by game name and prevents incorrect bets
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GameContext } from "../contexts/GameContext";

const FALLBACK_OPTIONS = ["CLOSE"]; // always safe default

export const useBettingGuard = ({
  gameName,
  selectedType,     // optional
  setSelectedType,  // optional
  onClosed,         // optional
} = {}) => {
  const { getGameRawByName, loadActiveGames } = useContext(GameContext);
  const game = getGameRawByName?.(gameName);

  // backend: ["Open","Close"] -> UI: ["OPEN","CLOSE"]
  const allowedTypes = useMemo(() => {
    const arr = Array.isArray(game?.allowed_types) ? game.allowed_types : [];
    return arr.map((x) => String(x || "").toUpperCase());
  }, [game?.allowed_types]);

  const pickerOptions = useMemo(() => {
    return allowedTypes.length ? allowedTypes : FALLBACK_OPTIONS;
  }, [allowedTypes]);

  const allowedLen = allowedTypes.length;
  const isClosed = allowedLen === 0;

  const [showClosedModal, setShowClosedModal] = useState(false);

  // ensure fresh data at mount
  useEffect(() => {
    if (!gameName) return;
    loadActiveGames?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameName]);

  // if it becomes closed while user is inside
  useEffect(() => {
    if (isClosed) setShowClosedModal(true);
  }, [isClosed]);

  // keep selected type valid when OPEN disappears
  useEffect(() => {
    if (!setSelectedType) return;
    if (!selectedType) return;

    const current = String(selectedType).toUpperCase();

    // if game is closed, we don't force any type; modal handles it
    if (allowedTypes.length === 0) return;

    if (!allowedTypes.includes(current)) {
      setSelectedType(allowedTypes[0]);
    }
  }, [allowedTypes, selectedType, setSelectedType]);

  const closeClosedModal = useCallback(() => {
    setShowClosedModal(false);
    onClosed?.();
  }, [onClosed]);

  // use in handlers: if (!guard()) return;
  const guard = useCallback(() => {
    if (!isClosed) return true;
    setShowClosedModal(true);
    return false;
  }, [isClosed]);

  return {
    game,
    allowedTypes,     // raw allowed list (might be empty)
    pickerOptions,    // ✅ ALWAYS non-empty (use this in dropdowns)
    allowedLen,
    isClosed,
    showClosedModal,
    closeClosedModal,
    guard,
  };
};