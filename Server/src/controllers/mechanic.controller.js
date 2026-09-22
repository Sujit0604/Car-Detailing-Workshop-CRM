const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse.js");
const {
  listMechanicsService,
  getMyMechanicService,
} = require("../services/mechanic.service.js");

const listMechanics = asyncHandler(async (req, res) => {
  const result = await listMechanicsService(req.query);

  return sendResponse(res, 200, "Mechanics fetched successfully", result);
});

const getMyMechanic = asyncHandler(async (req, res) => {
  const mechanic = await getMyMechanicService(req.user._id);

  return sendResponse(res, 200, "Mechanic profile fetched successfully", mechanic);
});

module.exports = {
  listMechanics,
  getMyMechanic,
};