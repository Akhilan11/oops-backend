/**
 * @module settings/controllers/settings
 * @description Admin settings endpoints: connections + email triggers.
 */

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const svc = require('../services/settings.service');

/** GET /api/admin/settings/connections */
const getConnections = asyncHandler(async (req, res) => {
  const connections = await svc.getConnections();
  res.json(new ApiResponse(200, 'Connections', { connections }));
});

/** PUT /api/admin/settings/connections/:id — Connect a service */
const connectService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === 'gmail') {
    const result = await svc.connectGmail(req.body);
    return res.json(new ApiResponse(200, 'Gmail connected', { connection: result }));
  }
  res.status(400).json(new ApiResponse(400, `Unknown connection: ${id}`));
});

/** DELETE /api/admin/settings/connections/:id — Disconnect a service */
const disconnectService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === 'gmail') {
    await svc.disconnectGmail();
    return res.json(new ApiResponse(200, 'Gmail disconnected'));
  }
  res.status(400).json(new ApiResponse(400, `Unknown connection: ${id}`));
});

/** GET /api/admin/settings/email-triggers */
const getEmailTriggers = asyncHandler(async (req, res) => {
  const triggers = await svc.getEmailTriggers();
  res.json(new ApiResponse(200, 'Email triggers', { triggers }));
});

/** PUT /api/admin/settings/email-triggers — Replace trigger map */
const updateEmailTriggers = asyncHandler(async (req, res) => {
  const triggers = await svc.updateEmailTriggers(req.body);
  res.json(new ApiResponse(200, 'Email triggers updated', { triggers }));
});

module.exports = { getConnections, connectService, disconnectService, getEmailTriggers, updateEmailTriggers };
