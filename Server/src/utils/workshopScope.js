const ApiError = require("./ApiError.js");
const Mechanic = require("../models/Mechanic.js");

// Workshop staff are posted to exactly one workshop. Every read and write on
// workshop scoped data (bookings, inventory, jobs, workshop master) is pinned to
// it so a workshop manager, service advisor or mechanic can never page through
// another workshop's records.
const WORKSHOP_SCOPED_ROLES = ["WORKSHOP_MANAGER", "SERVICE_ADVISOR", "MECHANIC"];

const isWorkshopScopedStaff = (user) =>
  Boolean(user) && WORKSHOP_SCOPED_ROLES.includes(user.role);

const getOwnWorkshopId = async (user) => {
  if (!isWorkshopScopedStaff(user)) return null;

  if (user.workshopId) return user.workshopId;

  // Mechanics are linked to a workshop through their profile, not the user doc.
  if (user.role === "MECHANIC") {
    const mechanic = await Mechanic.findOne({
      userId: user._id,
      status: { $ne: "INACTIVE" },
    })
      .select("workshopId")
      .lean();

    return mechanic?.workshopId || null;
  }

  return null;
};

// Returns the workshop the caller is allowed to touch. Admins and customers keep
// whatever they asked for, staff are forced onto their own workshop.
const resolveScopedWorkshopId = async (user, requestedWorkshopId) => {
  if (!isWorkshopScopedStaff(user)) {
    return requestedWorkshopId || null;
  }

  const ownWorkshopId = await getOwnWorkshopId(user);

  if (!ownWorkshopId) {
    throw new ApiError(403, "Your account is not assigned to a workshop");
  }

  if (
    requestedWorkshopId &&
    requestedWorkshopId.toString() !== ownWorkshopId.toString()
  ) {
    throw new ApiError(403, "You can only access data from your own workshop");
  }

  return ownWorkshopId;
};

// Throws unless the given workshop is the caller's own. Used to guard single
// document reads and mutations.
const assertOwnWorkshop = async (user, workshopId) => {
  if (!isWorkshopScopedStaff(user)) return;

  await resolveScopedWorkshopId(user, workshopId);
};

module.exports = {
  WORKSHOP_SCOPED_ROLES,
  isWorkshopScopedStaff,
  getOwnWorkshopId,
  resolveScopedWorkshopId,
  assertOwnWorkshop,
};
