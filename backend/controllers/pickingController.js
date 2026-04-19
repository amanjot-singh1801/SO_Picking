const { sheetsService } = require('../config/sheetsConfig');

const pickingController = {
  async getPendingSOs(req, res) {
    try {
      const data = await sheetsService.getPendingSOs();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async getSODetails(req, res) {
    try {
      const data = await sheetsService.getSODetails(req.params.so);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async startPicking(req, res) {
    try {
      await sheetsService.updateSOStatus(req.params.so, 'IN_PROGRESS');
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },

  async submitSO(req, res) {
    try {
      const { errors } = req.body;
      await sheetsService.appendErrors(errors || []);
      const finalStatus = (errors || []).length > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
      await sheetsService.updateFinalStatus(req.params.so, finalStatus);
      res.json({ success: true, finalStatus });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
  
   async getSKUMaster(req, res) {
    try {
      const data = await sheetsService.getSKUMaster();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  },
};

module.exports = pickingController;

