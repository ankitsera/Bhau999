import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Alert, TextField, CircularProgress, Card, CardContent, Divider } from '@mui/material';
import { propertyService } from 'src/services';

export default function NoticeBoardView() {
  const [noticeboards, setNoticeboards] = useState({
    NoticeBoard1: '',
    NoticeBoard2: '',
    NoticeBoard3: '',
    NoticeBoard4: '',
    NoticeBoard5: '',
  });

  const [initialNoticeboards, setInitialNoticeboards] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Auto-dismiss success messages after 2 seconds
  useEffect(() => {
    if (message.text && (message.type === 'success' || message.type === 'info')) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch all noticeboard properties from backend using getPropertyByKey
  const fetchNoticeboards = async () => {
    try {
      setLoading(true);
      const noticeboardsObj = {
        NoticeBoard1: '',
        NoticeBoard2: '',
        NoticeBoard3: '',
        NoticeBoard4: '',
        NoticeBoard5: '',
      };

      // Fetch each noticeboard individually using getPropertyByKey
      for (let i = 1; i <= 5; i++) {
        const key = `NoticeBoard${i}`;
        try {
          const response = await propertyService.getPropertyByKey(key);
          // API returns {property: {key, value}, message}
          if (response && response.property && response.property.value !== undefined) {
            noticeboardsObj[key] = response.property.value;
          }
        } catch (error) {
          // Silently skip 404 or any other errors - property may not exist yet
          console.log(`${key} not found or error, skipping...`);
        }
      }

      setNoticeboards(noticeboardsObj);
      setInitialNoticeboards(noticeboardsObj);
    } catch (error) {
      console.error('Error fetching noticeboards:', error);
      setMessage({ type: 'error', text: 'Failed to load noticeboards' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticeboards();
  }, []);

  const handleNoticeboardChange = (key, value) => {
    setNoticeboards((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Find changed noticeboards
      const changedNoticeboards = {};
      Object.keys(noticeboards).forEach((key) => {
        if (noticeboards[key] !== initialNoticeboards[key]) {
          changedNoticeboards[key] = noticeboards[key];
        }
      });

      if (Object.keys(changedNoticeboards).length === 0) {
        setMessage({ type: 'info', text: 'No changes to save' });
        return;
      }

      // Update all changed noticeboards
      await propertyService.updateMultipleProperties(changedNoticeboards);

      // Update initial values
      setInitialNoticeboards(noticeboards);
      setMessage({ type: 'success', text: 'Noticeboards saved successfully!' });
    } catch (error) {
      console.error('Error saving noticeboards:', error);
      setMessage({ type: 'error', text: 'Failed to save noticeboards' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading noticeboards...</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">NoticeBoard Settings</Typography>
      </Stack>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5].map((num) => {
          const key = `NoticeBoard${num}`;
          return (
            <Grid item xs={12} key={key}>
              <TextField
                fullWidth
                label={`NoticeBoard ${num}`}
                value={noticeboards[key]}
                onChange={(e) => handleNoticeboardChange(key, e.target.value)}
                multiline
                rows={2}
                placeholder={`Enter notice for NoticeBoard ${num}`}
              />
            </Grid>
          );
        })}

        <Grid item xs={12}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving}
            sx={{ minWidth: 200 }}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}
