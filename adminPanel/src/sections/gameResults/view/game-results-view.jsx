import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
} from '@mui/material';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useGames } from 'src/contexts/GameContext';
import { gameService } from 'src/services';
import Iconify from 'src/components/iconify';

dayjs.extend(customParseFormat);

// 3-digit result values list
const RESULT_VALUES = [
  "000", "100", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119",
  "120", "121", "122", "123", "124", "125", "126", "127", "128", "129", "130", "133",
  "134", "135", "136", "137", "138", "139", "140", "144", "145", "146", "147", "148",
  "149", "150", "155", "156", "157", "158", "159", "160", "166", "167", "168", "169",
  "170", "177", "178", "179", "180", "188", "189", "190", "199", "200", "220", "222",
  "223", "224", "225", "226", "227", "228", "229", "230", "233", "234", "235", "236",
  "237", "238", "239", "240", "244", "245", "246", "247", "248", "249", "250", "255",
  "256", "257", "258", "259", "260", "266", "267", "268", "269", "270", "277", "278",
  "279", "280", "288", "289", "290", "299", "300", "330", "333", "334", "335", "336",
  "337", "338", "339", "340", "344", "345", "346", "347", "348", "349", "350", "355",
  "356", "357", "358", "359", "360", "366", "367", "368", "369", "370", "377", "378",
  "379", "380", "388", "389", "390", "399", "400", "440", "444", "445", "446", "447",
  "448", "449", "450", "455", "456", "457", "458", "459", "460", "466", "467", "468",
  "469", "470", "477", "478", "479", "480", "488", "489", "490", "499", "500", "550",
  "555", "556", "557", "558", "559", "560", "566", "567", "568", "569", "570", "577",
  "578", "579", "580", "588", "589", "590", "599", "600", "660", "666", "667", "668",
  "669", "670", "677", "678", "679", "680", "688", "689", "690", "699", "700", "770",
  "777", "778", "779", "780", "788", "789", "790", "799", "800", "880", "888", "889",
  "890", "899", "900", "990", "999"
];

export default function GameResultsView() {
  const { games, loading: gamesLoading } = useGames();
  const [selectedGame, setSelectedGame] = useState('none');
  const [selectedType, setSelectedType] = useState('none');
  const [selectedResult, setSelectedResult] = useState('');
  const [midValue, setMidValue] = useState('');
  const [openSection, setOpenSection] = useState(false);
  const [declaring, setDeclaring] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showWinners, setShowWinners] = useState(false);
  const [winners, setWinners] = useState([]);
  const [checkingWinners, setCheckingWinners] = useState(false);
  const [winnersCount, setWinnersCount] = useState(0);
  const [activeGames, setActiveGames] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Auto-dismiss success messages
  useEffect(() => {
    if (message.text && (message.type === 'success' || message.type === 'info')) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const formatTimeValue = (value) => {
    if (!value) return '-';

    if (value instanceof Date) {
      return dayjs(value).isValid() ? dayjs(value).format('hh:mm A') : '-';
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      const parsed = dayjs(trimmed, ['HH:mm:ss', 'HH:mm', 'h:mm A', 'hh:mm A', 'YYYY-MM-DDTHH:mm:ss.SSS[Z]', 'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm'], true);

      if (parsed.isValid()) {
        return parsed.format('hh:mm A');
      }

      const fallback = dayjs(trimmed);
      if (fallback.isValid()) {
        return fallback.format('hh:mm A');
      }
    }

    return '-';
  };

  const loadGameStatus = async () => {
    try {
      setLoadingStatus(true);
      const activeData = await gameService.getActiveGames();
      setActiveGames(activeData || []);
    } catch (error) {
      console.error('Error loading game status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadGameStatus();
  }, [games]);

  const handleNext = () => {
    if (selectedType === 'none' || selectedGame === 'none') {
      setMessage({ type: 'error', text: 'Please select game and type' });
    } else {
      setOpenSection(true);
      setMessage({ type: '', text: '' });
    }
  };

  const handleResultChange = (e) => {
    const value = e.target.value;
    setSelectedResult(value);
    
    // Calculate mid value (sum of digits % 10)
    const num = Number(value);
    let sum = 0;
    sum += Math.floor(num / 100);
    let remainder = num % 100;
    sum += Math.floor(remainder / 10);
    remainder = remainder % 10;
    sum += remainder;
    const midVal = sum % 10;
    setMidValue(`${midVal}`);
  };

  const handleCheckWinner = async () => {
    try {
      if (!selectedResult) {
        setMessage({ type: 'error', text: 'Please select a result value' });
        return;
      }

      setCheckingWinners(true);
      setMessage({ type: '', text: '' });

      const resultNum = parseInt(selectedResult, 10);
      const payload = {
        gameName: selectedGame,
        when: selectedType,
        result: resultNum,
      };

      const response = await gameService.identifyWinners(payload);
      
      if (response && response.winners) {
        setWinners(response.winners);
        setWinnersCount(response.count || 0);
        setShowWinners(true);
        setMessage({ 
          type: 'info', 
          text: `Found ${response.count || 0} potential winner(s)` 
        });
      } else {
        setWinners([]);
        setWinnersCount(0);
        setShowWinners(false);
        setMessage({ type: 'info', text: 'No winners found for this result' });
      }
    } catch (error) {
      const errorMsg = error.message || 'Failed to check winners';
      setMessage({ type: 'error', text: errorMsg });
      setWinners([]);
      setShowWinners(false);
    } finally {
      setCheckingWinners(false);
    }
  };

  const handleDeclareResult = async () => {
    try {
      if (!selectedResult) {
        setMessage({ type: 'error', text: 'Please select a result value' });
        return;
      }

      setDeclaring(true);
      setMessage({ type: '', text: '' });

      const resultNum = parseInt(selectedResult, 10);
      const payload = {
        gameName: selectedGame,
        when: selectedType,
        result: resultNum,
      };

      await gameService.declareResult(payload);
      
      setMessage({ 
        type: 'success', 
        text: `${selectedType === 'open' ? 'Open' : 'Close'} result declared successfully for ${selectedGame}!` 
      });
      
      // Reset form
      setOpenSection(false);
      setSelectedResult('');
      setMidValue('');
      setSelectedGame('none');
      setSelectedType('none');
    } catch (error) {
      const errorMsg = error.message || 'Failed to declare result';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setDeclaring(false);
    }
  };

  const getMarketStatus = (gameName) => {
    const activeGame = activeGames.find((ag) => ag.gameName === gameName);
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
    const activeGame = activeGames.find((ag) => ag.gameName === gameName);
    if (!activeGame) return '-';

    const open = activeGame.openPana ?? activeGame.open_pana;
    const close = activeGame.closePana ?? activeGame.close_pana;

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

  if (gamesLoading) {
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
        <Typography variant="h4">Declare Results</Typography>

        {message.text && (
          <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} flexWrap="wrap">
          <Autocomplete
            options={games}
            getOptionLabel={(option) => {
              if (!option.name) return '';
              const openTime = option.openTime ? formatTimeValue(option.openTime) : '';
              const closeTime = option.closeTime ? formatTimeValue(option.closeTime) : '';
              return `${option.name} (${openTime}-${closeTime})`;
            }}
            value={games.find((g) => g.name === selectedGame) || null}
            onChange={(event, newValue) => {
              setSelectedGame(newValue ? newValue.name : 'none');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Game"
                variant="standard"
                placeholder="Search game..."
              />
            )}
            sx={{ m: 1, minWidth: { xs: '100%', sm: 300 } }}
            isOptionEqualToValue={(option, value) => option.name === value.name}
          />

          <FormControl variant="standard" sx={{ m: 1, minWidth: { xs: '100%', sm: 120 } }}>
            <InputLabel id="declare-result-type-label">Type</InputLabel>
            <Select
              labelId="declare-result-type-label"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="Type"
            >
              <MenuItem value="none">
                <em>Select Type</em>
              </MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="close">Close</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={handleNext} sx={{ m: 1 }}>
            Next
          </Button>
        </Stack>

        {openSection && (
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ flexWrap: 'wrap' }} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Autocomplete
              options={RESULT_VALUES}
              getOptionLabel={(option) => option}
              value={selectedResult || null}
              onChange={(event, newValue) => {
                if (newValue) {
                  const value = newValue;
                  setSelectedResult(value);

                  const num = Number(value);
                  let sum = 0;
                  sum += Math.floor(num / 100);
                  let remainder = num % 100;
                  sum += Math.floor(remainder / 10);
                  remainder = remainder % 10;
                  sum += remainder;
                  const midVal = sum % 10;
                  setMidValue(`${midVal}`);
                } else {
                  setSelectedResult('');
                  setMidValue('');
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={selectedType === 'open' ? 'Open' : 'Close'}
                  variant="standard"
                  placeholder="Search digit..."
                />
              )}
              sx={{ m: 1, minWidth: { xs: '100%', sm: 200 } }}
              isOptionEqualToValue={(option, value) => option === value}
            />

            <TextField
              disabled
              id="mid-value-field"
              label="Mid Value"
              variant="outlined"
              size="small"
              value={midValue}
              sx={{ m: 1, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#000' } }}
            />

            <Button
              variant="outlined"
              onClick={handleCheckWinner}
              disabled={checkingWinners || !selectedResult}
              sx={{ m: 1 }}
            >
              {checkingWinners ? 'Checking...' : 'Check Winner'}
            </Button>

            <Button
              variant="outlined"
              onClick={handleDeclareResult}
              disabled={declaring || !selectedResult}
              sx={{ m: 1 }}
            >
              {declaring ? 'Declaring...' : 'Declare'}
            </Button>
          </Stack>
        )}

        {showWinners && winners.length > 0 && (
          <Stack spacing={2}>
            <Typography variant="h6">
              Predicted Winners ({winnersCount})
            </Typography>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="winners table">
                <TableHead>
                  <TableRow>
                    <TableCell>Mobile Number</TableCell>
                    <TableCell>Bet Type</TableCell>
                    <TableCell align="right">Bet Value</TableCell>
                    <TableCell align="right">Bet Amount</TableCell>
                    <TableCell align="right">Open/Close</TableCell>
                    <TableCell>Bet Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {winners.map((winner) => (
                    <TableRow
                      key={winner.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {winner.mobileNumber}
                      </TableCell>
                      <TableCell>{winner.type}</TableCell>
                      <TableCell align="right">{winner.betValue}</TableCell>
                      <TableCell align="right">₹{winner.amount}</TableCell>
                      <TableCell align="right">{winner.openClose}</TableCell>
                      <TableCell>{new Date(winner.betTime).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}

        <Stack spacing={2}>
          <Typography variant="h6">Game Report</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: { xs: 360, md: 520 }, overflow: 'auto' }}>
            <Table stickyHeader size="small" aria-label="games report table">
              <TableHead>
                <TableRow>
                  <TableCell>S.No.</TableCell>
                  <TableCell>Game Name</TableCell>
                  <TableCell align="right">Open Time</TableCell>
                  <TableCell align="right">Close Time</TableCell>
                  <TableCell align="center">Result</TableCell>
                  <TableCell align="center">Market Status</TableCell>
                  <TableCell align="center">Sat/Sun</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {games.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        No games found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  games.map((game, index) => (
                    <TableRow key={game.name} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{game.name}</TableCell>
                      <TableCell align="right">
                        {formatTimeValue(game.openTime)}
                      </TableCell>
                      <TableCell align="right">
                        {formatTimeValue(game.closeTime)}
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Stack>
    </Container>
  );
}
