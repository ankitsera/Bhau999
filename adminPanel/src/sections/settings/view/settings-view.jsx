import dayjs from 'dayjs';
import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Alert, TextField, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { propertyService, rateService } from 'src/services';

// ----------------------------------------------------------------------

export default function SettingsView() {
  // State for properties mapped to backend keys
  const [properties, setProperties] = useState({
    withdrawal_time_start: '',
    withdrawal_time_end: '',
    call_support: '',
    whatsapp_support: '',
    UPI: '',
    banking_name: '',
    telegram_channel: '',
    minimum_withdrawal_amount: '',
    minimum_deposit_amount: '',
    min_bet_amount: '',
    max_bet_amount: '',
    headline: '',
    wallet_message: '',
    add_point_message: '',
    withdraw_message: '',
    base_rate: '',
    // IS_GATEWAY_UP: '1',
  });

  // Track initial values to detect changes
  const [initialProperties, setInitialProperties] = useState({});

  // State for game rates - matches backend Rate entity types
  const [rates, setRates] = useState({
    'Single Digit': '',
    'Jodi': '',
    'Single Pana': '',
    'Double Pana': '',
    'Triple Pana': '',
    'Half Sangam': '',
    'Full Sangam': '',
  });

  // Track initial rates to detect changes
  const [initialRates, setInitialRates] = useState({});


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Auto-dismiss success and info messages after 4 seconds
  useEffect(() => {
    if (message.text && (message.type === 'success' || message.type === 'info')) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  // Fetch all properties from backend
  const fetchProperties = async () => {
    try {
      setLoading(true);

      const data = await propertyService.getAllProperties();

      // Convert array of {key, value} to object
      const propsObj = {};
      data.forEach((prop) => {
        propsObj[prop.key] = prop.value || '';
      });

      setProperties((prevProps) => ({
        ...prevProps,
        ...propsObj,
      }));

      // Store initial values for change detection
      setInitialProperties(propsObj);

      // setMessage({ type: 'success', text: 'Settings loaded successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch game rates from backend
  const getRates = async () => {
    try {
      setLoading(true);

      const data = await rateService.getAllRates();

      // Convert array of {type, rate} to object
      const ratesObj = {
        'Single Digit': '',
        'Jodi': '',
        'Single Pana': '',
        'Double Pana': '',
        'Triple Pana': '',
        'Half Sangam': '',
        'Full Sangam': '',
      };

      data.forEach((rateItem) => {
        if (ratesObj.hasOwnProperty(rateItem.type)) {
          ratesObj[rateItem.type] = rateItem.rate?.toString() || '';
        }
      });

      setRates(ratesObj);
      setInitialRates(ratesObj);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load game rates' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    getRates();
  }, []);

  // Handle property changes
  const handlePropertyChange = (key, value) => {
    setProperties((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save only changed properties to backend
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Filter only changed properties
      const changedProperties = Object.entries(properties).filter(
        ([key, value]) => initialProperties[key] !== value
      );

      if (changedProperties.length === 0) {
        setMessage({ type: 'info', text: 'No changes to save' });
        setSaving(false);
        return;
      }

      // Save each changed property individually using service
      const savePromises = changedProperties.map(async ([key, value]) => {
        return propertyService.updateProperty(key, value);
      });

      await Promise.all(savePromises);

      // Update initial values after successful save
      setInitialProperties({ ...properties });

      setMessage({
        type: 'success',
        text: `Successfully saved ${changedProperties.length} setting(s)!`,
      });
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to save settings: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Handle game rates submit
  const handleSubmitRates = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Filter only changed rates
      const changedRates = Object.entries(rates).filter(
        ([type, rate]) => initialRates[type] !== rate
      );

      // Check if base_rate changed
      const baseRateChanged = initialProperties.base_rate !== properties.base_rate;

      if (changedRates.length === 0 && !baseRateChanged) {
        setMessage({ type: 'info', text: 'No changes to save' });
        setSaving(false);
        return;
      }

      // Validate only changed rates
      const invalidRates = changedRates.filter(([type, rate]) => {
        const numRate = parseFloat(rate);
        return !rate || isNaN(numRate) || numRate <= 0;
      });

      if (invalidRates.length > 0) {
        setMessage({
          type: 'error',
          text: `Please enter valid positive numbers for: ${invalidRates.map(([type]) => type).join(', ')}`
        });
        setSaving(false);
        return;
      }

      const promises = [];

      // Save only changed rates
      if (changedRates.length > 0) {
        const ratePromises = changedRates.map(async ([type, rate]) => {
          const payload = {
            type: type,
            rate: parseFloat(rate),
          };
          return rateService.updateRate(payload);
        });
        promises.push(...ratePromises);
      }

      // Save base_rate only if it changed
      if (baseRateChanged) {
        promises.push(propertyService.updateProperty('base_rate', properties.base_rate || ''));
      }

      await Promise.all(promises);

      // Update initial values after successful save
      setInitialRates({ ...rates });
      setInitialProperties({ ...initialProperties, base_rate: properties.base_rate });

      const changedCount = changedRates.length + (baseRateChanged ? 1 : 0);
      setMessage({ type: 'success', text: `Successfully saved ${changedCount} rate(s)!` });
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to update game rates: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  // Handle message settings submit - same logic as handleSaveSettings
  const handleMessageChange = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Filter only changed message properties
      const messageKeys = ['wallet_message', 'add_point_message', 'withdraw_message', 'headline'];
      const changedMessages = Object.entries(properties)
        .filter(([key, value]) => messageKeys.includes(key) && initialProperties[key] !== value);

      if (changedMessages.length === 0) {
        setMessage({ type: 'info', text: 'No changes to save' });
        setSaving(false);
        return;
      }

      // Save each changed message individually using service
      const savePromises = changedMessages.map(async ([key, value]) => {
        return propertyService.updateProperty(key, value);
      });

      await Promise.all(savePromises);

      // Update initial values after successful save
      setInitialProperties({ ...properties });

      setMessage({
        type: 'success',
        text: `Successfully saved ${changedMessages.length} message(s)!`,
      });
    } catch (error) {

      // Check if it's a network error
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        setMessage({
          type: 'error',
          text: `Network error: Cannot connect to ${API_URL}properties. Check if backend is running and CORS is configured.`,
        });
      } else {
        setMessage({ type: 'error', text: `Failed to save messages: ${error.message}` });
      }
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <Container>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '400px' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading settings...</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container>
      <Stack spacing={4}>
        <Typography variant="h3" component="h1">
          Settings
        </Typography>

        {message.text && (
          <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        <Stack spacing={3}>
          <Typography variant="h5" component="h2">
            Application Settings
          </Typography>

          <Grid container spacing={3}>
            {/* Withdrawal Time Start */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={['TimePicker']}>
                  <TimePicker
                    label="Withdrawal Start Time"
                    value={
                      properties.withdrawal_time_start &&
                      dayjs(properties.withdrawal_time_start, 'HH:mm:ss').isValid()
                        ? dayjs(properties.withdrawal_time_start, 'HH:mm:ss')
                        : null
                    }
                    onChange={(newVal) =>
                      handlePropertyChange(
                        'withdrawal_time_start',
                        newVal && dayjs(newVal).isValid() ? dayjs(newVal).format('HH:mm:ss') : ''
                      )
                    }
                    viewRenderers={{
                      hours: renderTimeViewClock,
                      minutes: renderTimeViewClock,
                      seconds: renderTimeViewClock,
                    }}
                    sx={{ width: '100%' }}
                  />
                </DemoContainer>
              </LocalizationProvider>
            </Grid>

            {/* Withdrawal Time End */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer components={['TimePicker']}>
                  <TimePicker
                    label="Withdrawal End Time"
                    value={
                      properties.withdrawal_time_end &&
                      dayjs(properties.withdrawal_time_end, 'HH:mm:ss').isValid()
                        ? dayjs(properties.withdrawal_time_end, 'HH:mm:ss')
                        : null
                    }
                    onChange={(newVal) =>
                      handlePropertyChange(
                        'withdrawal_time_end',
                        newVal && dayjs(newVal).isValid() ? dayjs(newVal).format('HH:mm:ss') : ''
                      )
                    }
                    viewRenderers={{
                      hours: renderTimeViewClock,
                      minutes: renderTimeViewClock,
                      seconds: renderTimeViewClock,
                    }}
                    sx={{ width: '100%' }}
                  />
                </DemoContainer>
              </LocalizationProvider>
            </Grid>

            {/* Call Support */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Call Support Number"
                variant="outlined"
                value={properties.call_support}
                onChange={(e) => handlePropertyChange('call_support', e.target.value)}
                type="tel"
                placeholder="Call Support Number"
              />
            </Grid>

            {/* WhatsApp Support */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="WhatsApp Support Number"
                variant="outlined"
                value={properties.whatsapp_support}
                onChange={(e) => handlePropertyChange('whatsapp_support', e.target.value)}
                type="tel"
                placeholder="Whatsapp Support Number"
              />
            </Grid>

            {/* UPI ID */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="UPI ID"
                variant="outlined"
                value={properties.UPI}
                onChange={(e) => handlePropertyChange('UPI', e.target.value)}
                placeholder="Enter your UPI ID"
              />
            </Grid>

            {/* Banking Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Banking Name"
                variant="outlined"
                value={properties.banking_name}
                onChange={(e) => handlePropertyChange('banking_name', e.target.value)}
                placeholder="Enter your banking name"
              />
            </Grid>

            {/* Telegram Channel */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telegram Channel"
                variant="outlined"
                value={properties.telegram_channel}
                onChange={(e) => handlePropertyChange('telegram_channel', e.target.value)}
                placeholder="@yourchannel"
              />
            </Grid>

            {/* Minimum Withdrawal Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Withdrawal Amount"
                variant="outlined"
                value={properties.minimum_withdrawal_amount}
                onChange={(e) => handlePropertyChange('minimum_withdrawal_amount', e.target.value)}
                type="number"
                placeholder="100"
              />
            </Grid>

            {/* Minimum Deposit Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Deposit Amount"
                variant="outlined"
                value={properties.minimum_deposit_amount}
                onChange={(e) => handlePropertyChange('minimum_deposit_amount', e.target.value)}
                type="number"
                placeholder="100"
              />
            </Grid>

            {/* Min Bet Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Bet Amount"
                variant="outlined"
                value={properties.min_bet_amount}
                onChange={(e) => handlePropertyChange('min_bet_amount', e.target.value)}
                type="number"
                placeholder="10"
              />
            </Grid>

            {/* Max Bet Amount */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Maximum Bet Amount"
                variant="outlined"
                value={properties.max_bet_amount}
                onChange={(e) => handlePropertyChange('max_bet_amount', e.target.value)}
                type="number"
                placeholder="10000"
              />
            </Grid>

            {/* Payment Method Selection */}
            {/* <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                <Select
                  labelId="payment-method-label"
                  id="payment-method-select"
                  value={properties.IS_GATEWAY_UP || '1'}
                  label="Payment Method"
                  onChange={(e) => handlePropertyChange('IS_GATEWAY_UP', e.target.value)}
                >
                  <MenuItem value="1">Gateway</MenuItem>
                  <MenuItem value="0">UPI</MenuItem>
                </Select>
              </FormControl>
            </Grid> */}
          </Grid>

          <Button
            variant="contained"
            onClick={handleSaveSettings}
            disabled={saving}
            size="large"
            sx={{ mt: 2 }}
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </Stack>

        {/* Game Rates Section */}
        <Stack spacing={3}>
          <Typography variant="h5" component="h2">
            Game Rates
          </Typography>

          <Stack spacing={2}>
            {/* Point field - applies to all rates */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ minWidth: '150px', fontWeight: 'bold' }}>Point (Min Bet)</Typography>
              <TextField
                variant="outlined"
                label="Point"
                type="number"
                value={properties.base_rate || ''}
                onChange={(e) => handlePropertyChange('base_rate', e.target.value)}
                sx={{ maxWidth: '200px' }}
              />
            </Stack>

            {/* Individual rate rows */}
            {Object.entries(rates).map(([type, rate]) => (
              <Stack key={type} direction="row" spacing={2} alignItems="center">
                <Typography sx={{ minWidth: '150px' }}>{type}</Typography>
                <TextField
                  variant="outlined"
                  label="Rate"
                  type="number"
                  value={rate}
                  onChange={(e) => setRates({ ...rates, [type]: e.target.value })}
                  sx={{ maxWidth: '400px' }}
                />
              </Stack>
            ))}

            <Button variant="contained" onClick={handleSubmitRates} size="large">
              Save Game Rates
            </Button>
          </Stack>
        </Stack>

        {/* Message Settings Section */}
        <Stack spacing={3}>
          <Typography variant="h5" component="h2">
            Message Settings
          </Typography>

          <Stack spacing={3}>
            <TextField
              fullWidth
              variant="outlined"
              label="Wallet Message"
              value={properties?.wallet_message || ''}
              onChange={(e) => handlePropertyChange('wallet_message', e.target.value)}
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Add Point Message"
              variant="outlined"
              value={properties?.add_point_message || ''}
              onChange={(e) => handlePropertyChange('add_point_message', e.target.value)}
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Home Screen Message"
              variant="outlined"
              value={properties?.headline || ''}
              onChange={(e) => handlePropertyChange('headline', e.target.value)}
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Withdraw Message"
              variant="outlined"
              value={properties?.withdraw_message || ''}
              onChange={(e) => handlePropertyChange('withdraw_message', e.target.value)}
              multiline
              rows={2}
            />

            <Button variant="contained" onClick={handleMessageChange} size="large">
              Save Messages
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
