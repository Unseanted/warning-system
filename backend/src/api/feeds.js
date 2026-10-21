import { Router } from 'express';
import {
  getStationLiveFeatures,
  getAllStationsLive,
  getNimetInfo,
  STATION_COORDS,
} from '../services/dataFeedService.js';

const router = Router();

router.get('/live', async (_req, res, next) => {
  try {
    res.json(await getAllStationsLive());
  } catch (e) {
    next(e);
  }
});

router.get('/live/:name', async (req, res, next) => {
  try {
    const key = Object.keys(STATION_COORDS).find(
      (k) => k.toLowerCase() === String(req.params.name).toLowerCase()
    );
    if (!key) {
      return res.status(404).json({
        detail: `Unknown station. Choose: ${Object.keys(STATION_COORDS).join(', ')}`,
      });
    }
    res.json(await getStationLiveFeatures(key));
  } catch (e) {
    res.status(502).json({ detail: `Upstream weather API error: ${e.message || e}` });
  }
});

router.get('/nimet-info', (_req, res) => res.json(getNimetInfo()));
router.get('/stations-coords', (_req, res) => res.json(STATION_COORDS));

export default router;
