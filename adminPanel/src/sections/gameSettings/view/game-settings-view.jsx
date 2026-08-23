import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Checkbox,
  FormControlLabel,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import { useGames } from 'src/contexts/GameContext';
import { gameService } from 'src/services';
import Iconify from 'src/components/iconify';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export default function GameSettingsView() {
  const { games, loading, refetch } = useGames();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedGame, setSelectedGame] = useState(null);
  const [openTimeSortOrder, setOpenTimeSortOrder] = useState('asc');
  const [activeGames, setActiveGames] = useState([]);
  const [disabledGames, setDisabledGames] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    openTime: null,
    closeTime: null,
    saturday: false,
    sunday: false,
  });

  // Sort handler for Open Time
  const handleOpenTimeSort = () => {
    setOpenTimeSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Sort games by open time
  const sortedGames = [...games].sort((a, b) => {
    if (!a.openTime || !b.openTime) return 0;
    const timeA = dayjs(a.openTime, 'HH:mm:ss');
    const timeB = dayjs(b.openTime, 'HH:mm:ss');
    if (openTimeSortOrder === 'asc') {
      return timeA.isAfter(timeB) ? 1 : -1;
    }
    return timeB.isAfter(timeA) ? 1 : -1;
  });

  // Load active games and disabled games
  const loadGameStatus = async () => {
    try {
      setLoadingStatus(true);
      const [activeData, disabledData] = await Promise.all([
        gameService.getActiveGames(),
        gameService.getDisabledGames()
      ]);
      setActiveGames(activeData || []);
      setDisabledGames(disabledData || []);
    } catch (error) {
      console.error('Error loading game status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  React.useEffect(() => {
    loadGameStatus();
  }, [games]);

  // Auto-dismiss messages
  React.useEffect(() => {
    if (message.text && (message.type === 'success' || message.type === 'info')) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleOpenDialog = (game = null) => {
    if (game) {
      setEditMode(true);
      setSelectedGame(game);

      // Safely parse time values with validation
      let openTime = null;
      let closeTime = null;

      if (game.openTime && typeof game.openTime === 'string') {
        const parsedOpenTime = dayjs(game.openTime, 'HH:mm:ss', true); // strict parsing
        if (parsedOpenTime.isValid()) {
          openTime = parsedOpenTime;
        }
      }

      if (game.closeTime && typeof game.closeTime === 'string') {
        const parsedCloseTime = dayjs(game.closeTime, 'HH:mm:ss', true); // strict parsing
        if (parsedCloseTime.isValid()) {
          closeTime = parsedCloseTime;
        }
      }

      setFormData({
        name: game.name,
        openTime,
        closeTime,
        saturday: game.saturday || false,
        sunday: game.sunday || false,
      });
    } else {
      setEditMode(false);
      setSelectedGame(null);
      setFormData({
        name: '',
        openTime: null,
        closeTime: null,
        saturday: false,
        sunday: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      name: '',
      openTime: null,
      closeTime: null,
      saturday: false,
      sunday: false,
    });
  };

  const handleSaveGame = async () => {
    try {
      // Validation
      if (!formData.name || !formData.name.trim()) {
        setMessage({ type: 'error', text: 'Game name is required' });
        return;
      }

      if (!formData.openTime || !formData.closeTime) {
        setMessage({ type: 'error', text: 'Open and Close times are required' });
        return;
      }

      setSaving(true);
      setMessage({ type: '', text: '' });

      const gameData = {
        name: formData.name.trim(),
        openTime: formData.openTime.format('HH:mm:ss'),
        closeTime: formData.closeTime.format('HH:mm:ss'),
        saturday: formData.saturday,
        sunday: formData.sunday,
      };

      if (editMode) {
        await gameService.updateGame(gameData);
        setMessage({ type: 'success', text: 'Game updated successfully!' });
      } else {
        await gameService.createGame(gameData);
        setMessage({ type: 'success', text: 'Game created successfully!' });
      }

      await refetch();
      handleCloseDialog();
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to save game: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteDialog = (game) => {
    setSelectedGame(game);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedGame(null);
  };

  const handleDeleteGame = async () => {
    if (!selectedGame) return;

    try {
      setSaving(true);
      await gameService.setGameEnabled(selectedGame.name, false);
      setMessage({ type: 'success', text: `Game "${selectedGame.name}" disabled successfully!` });
      await refetch();
      await loadGameStatus();
      handleCloseDeleteDialog();
    } catch (error) {
      const errorMsg = error.message || 'Failed to disable game';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGameRunning = async (gameName, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await gameService.setGameRunning(gameName, newStatus);
      setMessage({
        type: 'success',
        text: `Game "${gameName}" ${newStatus ? 'started' : 'stopped'} successfully!`
      });
      await loadGameStatus();
    } catch (error) {
      const errorMsg = error.message || 'Failed to update game status';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  const getMarketStatus = (gameName) => {
    const activeGame = activeGames.find(ag => ag.gameName === gameName);
    if (!activeGame) return { status: 'Unknown', color: 'text.secondary' };

    const allowedTypes = activeGame.allowed_types || [];
    if (allowedTypes.length === 2) {
      return { status: 'Open Running', color: 'success.main' };
    }
    if (allowedTypes.length === 1) {
      return { status: 'Close Running', color: 'warning.main' };
    }
    return { status: 'Closed', color: 'error.main' };
  };

  const getGameResult = (gameName) => {
    const activeGame = activeGames.find(ag => ag.gameName === gameName);
    if (!activeGame) return '-';
    
    const open = activeGame.openPana ?? activeGame.open_pana;
    const close = activeGame.closePana ?? activeGame.close_pana;
    
    // Helper function to calculate sum of digits % 10
    const getDigitSum = (num) => {
      if (num === null || num === undefined) return null;
      const str = String(num).padStart(3, '0');
      const sum = str.split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
      return sum % 10;
    };
    
    if (open !== null && open !== undefined && close !== null && close !== undefined) {
      const openStr = String(open).padStart(3, '0');
      const closeStr = String(close).padStart(3, '0');
      const openSum = getDigitSum(open);
      const closeSum = getDigitSum(close);
      return `${openStr}-${openSum}${closeSum}-${closeStr}`;
    }
    if (open !== null && open !== undefined) {
      const openStr = String(open).padStart(3, '0');
      const openSum = getDigitSum(open);
      return `${openStr}-${openSum}*-***`;
    }
    return '-';
  };

  const isGameRunning = (gameName) => {
    const activeGame = activeGames.find(ag => ag.gameName === gameName);
    return activeGame?.runningToday ?? false;
  };

  if (loading) {
    return (
      <Container>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '400px' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading games...</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">Game Settings</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => handleOpenDialog()}
          >
            Add Game
          </Button>
        </Stack>

        {message.text && (
          <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>S.No.</TableCell>
                <TableCell>Game Name</TableCell>
                <TableCell align="right">
                  <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                    <span>Open Time</span>
                    <IconButton
                      size="small"
                      onClick={handleOpenTimeSort}
                      title={openTimeSortOrder === 'asc' ? 'Earliest first (click for latest first)' : 'Latest first (click for earliest first)'}
                    >
                      {openTimeSortOrder === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell align="right">Close Time</TableCell>
                <TableCell align="center">Result</TableCell>
                <TableCell align="center">Market Status</TableCell>
                <TableCell align="center">Sat/Sun</TableCell>
                <TableCell align="center">Open/Close Game</TableCell>
                <TableCell align="right">Edit</TableCell>
                <TableCell align="right">Disable</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {games.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography variant="body2" color="text.secondary" py={3}>
                      No games found. Click "Add Game" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedGames.map((game, index) => (
                  <TableRow key={game.name}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{game.name}</TableCell>
                    <TableCell align="right">
                      {game.openTime ? dayjs(game.openTime, 'HH:mm:ss').format('hh:mm A') : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {game.closeTime ? dayjs(game.closeTime, 'HH:mm:ss').format('hh:mm A') : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {getGameResult(game.name)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        sx={{ color: getMarketStatus(game.name).color }}
                      >
                        {getMarketStatus(game.name).status}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {game.saturday && (
                          <Iconify icon="eva:checkmark-circle-2-fill" color="success.main" width={20} />
                        )}
                        {game.sunday && (
                          <Iconify icon="eva:checkmark-circle-2-fill" color="success.main" width={20} />
                        )}
                        {!game.saturday && !game.sunday && (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant={isGameRunning(game.name) ? "contained" : "outlined"}
                        color={isGameRunning(game.name) ? "error" : "success"}
                        size="small"
                        onClick={() => handleToggleGameRunning(game.name, isGameRunning(game.name))}
                        disabled={loadingStatus}
                      >
                        {isGameRunning(game.name) ? 'Stop' : 'Start'}
                      </Button>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(game)}
                        title="Edit Game"
                      >
                        <Iconify icon="eva:edit-2-outline" />
                      </IconButton>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDeleteDialog(game)}
                        title="Disable Game"
                      >
                        <Iconify icon="eva:close-circle-outline" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      {/* Add/Edit Game Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Game' : 'Add New Game'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Game Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              disabled={editMode}
              helperText={editMode ? 'Game name cannot be changed' : ''}
            />

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label="Open Time"
                value={formData.openTime}
                onChange={(newValue) => setFormData({ ...formData, openTime: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />

              <TimePicker
                label="Close Time"
                value={formData.closeTime}
                onChange={(newValue) => setFormData({ ...formData, closeTime: newValue })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>

            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.saturday}
                    onChange={(e) => setFormData({ ...formData, saturday: e.target.checked })}
                  />
                }
                label="Available on Saturday"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.sunday}
                    onChange={(e) => setFormData({ ...formData, sunday: e.target.checked })}
                  />
                }
                label="Available on Sunday"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSaveGame} variant="contained" disabled={saving}>
            {saving ? 'Saving...' : editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Disable Game</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to disable the game <strong>{selectedGame?.name}</strong>?
            This will stop the game from running and hide it from users.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleDeleteGame} color="error" variant="contained" disabled={saving}>
            {saving ? 'Disabling...' : 'Disable'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
