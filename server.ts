import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { centralDb } from './server/db';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers with payload allowance for posters/receipts
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper to check if requester is admin
const isAdminRequest = (req: Request): boolean => {
  const authHeader = req.headers['x-admin-auth'];
  return authHeader === 'admin' || authHeader === 'rajanbhogta';
};

// ==================== REAL-TIME SSE SYNC ====================
app.get('/api/sync/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Initial connection handshake
  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', time: Date.now() })}\n\n`);
  centralDb.registerClient(res);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Full Public Snapshot for initial page load / reconnection
app.get('/api/sync', (_req: Request, res: Response) => {
  res.json(centralDb.getPublicSnapshot());
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    connectedClients: centralDb.getConnectedClientsCount(),
    timestamp: new Date().toISOString(),
    cinema: 'Laxmi Cineplex Hazaribagh',
  });
});

// ==================== MOVIES API ====================
app.get('/api/movies', (_req: Request, res: Response) => {
  res.json(centralDb.getMovies());
});

app.get('/api/movies/:id', (req: Request, res: Response) => {
  const movie = centralDb.getMovieById(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Movie not found' });
  res.json(movie);
});

app.post('/api/movies', (req: Request, res: Response) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const movie = centralDb.saveMovie(req.body, actor);
    res.status(201).json(movie);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/movies/:id', (req: Request, res: Response) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const movie = centralDb.updateMovie(req.params.id, req.body, actor);
    res.json(movie);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/movies/:id', (req: Request, res: Response) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const result = centralDb.deleteOrArchiveMovie(req.params.id, actor);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== BANNERS API ====================
app.get('/api/banners', (_req: Request, res: Response) => {
  res.json(centralDb.getBanners());
});

app.post('/api/banners', (req: Request, res: Response) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const banner = centralDb.saveBanner(req.body, actor);
    res.status(201).json(banner);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/banners/:id', (req: Request, res: Response) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const banner = centralDb.updateBanner(req.params.id, req.body, actor);
    res.json(banner);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/banners/:id', (req: Request, res: Response) => {
  const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
  const success = centralDb.deleteBanner(req.params.id, actor);
  res.json({ success });
});

app.post('/api/banners/reorder', (req: Request, res: Response) => {
  const { orderedIds } = req.body;
  const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
  if (Array.isArray(orderedIds)) {
    centralDb.reorderBanners(orderedIds, actor);
  }
  res.json({ success: true });
});

// ==================== SCREENS & SHOWS API ====================
app.get('/api/screens', (_req: Request, res: Response) => {
  res.json(centralDb.getScreens());
});

app.get('/api/shows', (_req: Request, res: Response) => {
  res.json(centralDb.getShows());
});

app.post('/api/shows', (req: Request, res: Response) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const show = centralDb.saveShow(req.body, actor);
    res.status(201).json(show);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/shows/:id', (req: Request, res: Response) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const show = centralDb.updateShow(req.params.id, req.body, actor);
    res.json(show);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/shows/:id', (req: Request, res: Response) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const reason = (req.query.reason as string) || 'Cancelled by Admin';
    const show = centralDb.cancelShow(req.params.id, reason, actor);
    res.json(show);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/shows/check-overlap', (req: Request, res: Response) => {
  const { screenId, date, startTime, endTime, excludeShowId } = req.body;
  const result = centralDb.checkShowOverlap(screenId, date, startTime, endTime, excludeShowId);
  res.json(result);
});

// ==================== SEAT HOLDS & ATOMIC RESERVATIONS ====================
app.get('/api/shows/:id/occupied-seats', (req: Request, res: Response) => {
  const seats = centralDb.getOccupiedSeatsForShow(req.params.id);
  res.json({ showId: req.params.id, occupiedSeats: seats });
});

app.post('/api/bookings/hold', async (req: Request, res: Response) => {
  try {
    const { showId, seatLabels, userId, holdMinutes } = req.body;
    if (!showId || !Array.isArray(seatLabels) || seatLabels.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing showId or seatLabels' });
    }
    const result = await centralDb.holdSeats(showId, seatLabels, userId || 'guest-session', holdMinutes || 8);
    if (!result.success) {
      return res.status(409).json(result);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/bookings/release-hold', async (req: Request, res: Response) => {
  try {
    const { showId, userId } = req.body;
    if (showId && userId) {
      await centralDb.releaseHoldsForUser(showId, userId);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== BOOKINGS API ====================
// Atomic pending UPI booking
app.post('/api/bookings/pending-upi', async (req: Request, res: Response) => {
  try {
    const booking = await centralDb.createPendingUpiBooking(req.body);
    res.status(201).json(booking);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Atomic confirmed booking
app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    const booking = await centralDb.createConfirmedBooking(req.body);
    res.status(201).json(booking);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Access-controlled bookings list
app.get('/api/bookings', (req: Request, res: Response) => {
  const isAdmin = isAdminRequest(req);
  const filterUserId = (req.query.userId as string) || (req.query.phone as string) || (req.query.email as string);

  // If customer is querying, only return their private bookings
  const bookings = centralDb.getBookings(filterUserId, isAdmin);
  res.json(bookings);
});

// Access-controlled single booking view
app.get('/api/bookings/:id', (req: Request, res: Response) => {
  const isAdmin = isAdminRequest(req);
  const filterUserId = (req.query.userId as string) || (req.query.phone as string) || (req.query.email as string);
  const booking = centralDb.getBookingById(req.params.id, filterUserId, isAdmin);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found or not authorized' });
  }
  res.json(booking);
});

// Admin verify/reject payment
app.post('/api/bookings/:id/verify-payment', async (req: Request, res: Response) => {
  try {
    const { action, reason } = req.body;
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta (Admin)';
    const booking = await centralDb.verifyPayment(req.params.id, action, reason, actor);
    res.json(booking);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Cancel booking
app.post('/api/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const result = await centralDb.cancelBooking(req.params.id, reason, actor);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Gate Turnstile Validator
app.post('/api/validator/scan', (req: Request, res: Response) => {
  const { token } = req.body;
  const actor = (req.headers['x-actor'] as string) || 'Turnstile Gate Staff';
  const result = centralDb.validateTicketToken(token, actor);
  res.json(result);
});

// ==================== SETTINGS & CONTENT API ====================
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(centralDb.getSettings());
});

app.put('/api/settings', (req: Request, res: Response) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const settings = centralDb.updateSettings(req.body, actor);
    res.json(settings);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/announcements', (_req: Request, res: Response) => {
  res.json(centralDb.getAnnouncements());
});

app.put('/api/announcements', (req: Request, res: Response) => {
  const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
  centralDb.saveAnnouncements(req.body, actor);
  res.json({ success: true });
});

app.get('/api/pages', (_req: Request, res: Response) => {
  res.json(centralDb.getPages());
});

app.put('/api/pages/:id', (req: Request, res: Response) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
    const page = centralDb.updatePage(req.params.id, req.body, actor);
    res.json(page);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/coupons', (_req: Request, res: Response) => {
  res.json(centralDb.getCoupons());
});

app.post('/api/coupons', (req: Request, res: Response) => {
  const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
  const coupon = centralDb.saveCoupon(req.body, actor);
  res.status(201).json(coupon);
});

app.get('/api/analytics', (_req: Request, res: Response) => {
  res.json(centralDb.getAnalytics());
});

app.get('/api/audit', (_req: Request, res: Response) => {
  res.json(centralDb.getAuditLogs());
});

app.post('/api/database/restore', (req: Request, res: Response) => {
  const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
  const result = centralDb.restoreDatabase(req.body, actor);
  res.json(result);
});

app.post('/api/database/reset', (req: Request, res: Response) => {
  const actor = (req.headers['x-actor'] as string) || 'rajanbhogta';
  centralDb.resetDatabase(actor);
  res.json({ success: true, message: 'Database reset to default seed' });
});

// ==================== VIDEO ORDERS & ENTITLEMENTS API ====================
app.get('/api/video-orders', (req: Request, res: Response) => {
  const isAdmin = isAdminRequest(req);
  const userId = (req.query.userId as string) || (req.query.email as string);
  const orders = centralDb.getVideoOrders(userId, isAdmin);
  res.json(orders);
});

app.post('/api/video-orders', (req: Request, res: Response) => {
  try {
    const { userId, contentId, orderType, amount, upiReference, customerName, customerPhone, userEmail } = req.body;
    if (!userId || !contentId || !orderType || amount === undefined) {
      return res.status(400).json({ error: 'Missing required order fields: userId, contentId, orderType, amount' });
    }
    if (!upiReference || upiReference.trim().length < 8) {
      return res.status(400).json({ error: 'Valid 12-digit UPI UTR reference number is required' });
    }

    const order = centralDb.createVideoOrder({
      userId,
      userEmail: userEmail || 'customer@laxmicineplex.in',
      customerName: customerName || 'Valued Patron',
      customerPhone: customerPhone || '',
      contentId,
      contentTitle: req.body.contentTitle || 'Digital Media Content',
      orderType,
      amount: Number(amount),
      currency: 'INR',
      rentalDurationHours: req.body.rentalDurationHours || (orderType === 'RENTAL' ? 48 : undefined),
      paymentMethod: 'UPI',
      paymentStatus: 'PENDING',
      upiReference: upiReference.trim(),
    });

    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/video-orders/:id/verify', (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    if (action !== 'APPROVE' && action !== 'REJECT') {
      return res.status(400).json({ error: 'Action must be APPROVE or REJECT' });
    }
    const actor = (req.headers['x-actor'] as string) || 'rajanbhogta (Admin)';
    const result = centralDb.verifyVideoOrder(req.params.id, action, actor);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/entitlements', (req: Request, res: Response) => {
  const isAdmin = isAdminRequest(req);
  const userId = (req.query.userId as string) || (req.query.email as string);
  const rentals = centralDb.getRentals(userId, isAdmin);
  const purchases = centralDb.getPurchases(userId, isAdmin);
  res.json({ rentals, purchases });
});

app.get('/api/video/playback/:contentId', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string);
  const access = centralDb.checkPlaybackAccess(req.params.contentId, userId);
  if (!access.allowed) {
    return res.status(403).json(access);
  }
  res.json(access);
});

// ==================== FRONTEND VITE INTEGRATION ====================
async function startServer() {
  if (!isProduction) {
    // Development: Attach Vite middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode');
  } else {
    // Production: Serve dist directory
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      console.log(`[Server] Serving production build from ${distPath}`);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 Laxmi Cineplex Central Full-Stack Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
