import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Alert, TextField, CircularProgress } from '@mui/material';

import { API_URL } from 'src/variables';

export default function SendNotificationsView() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Please fill in both title and message fields' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const response = await fetch(`${API_URL}users/notify-topic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
          message: body,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }

      setMessage({ type: 'success', text: 'Notification sent successfully!' });
      setTitle('');
      setBody('');
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to send notification: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Stack spacing={4}>
        <Typography variant="h3" component="h1">
          Send Notifications
        </Typography>

        {message.text && (
          <Alert severity={message.type} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        )}

        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Title"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Message"
            variant="outlined"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter notification message"
            multiline
            rows={6}
            disabled={loading}
          />

          <Button
            variant="contained"
            onClick={handleSend}
            disabled={loading}
            size="large"
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Notification'}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
