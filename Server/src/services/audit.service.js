const mongoose = require("mongoose");
const AuditLog = require("../models/AuditLog.js");

const SENSITIVE_KEY_PATTERN = /password|token|secret/i;

const normalizeObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

const redactValue = (value, seen = new WeakSet()) => {
  if (value === null || value === undefined) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "function" || typeof value === "symbol") return undefined;
  if (value instanceof Date) return new Date(value.getTime());
  if (Buffer.isBuffer(value)) return `[Buffer:${value.length}]`;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();

  if (typeof value !== "object") return String(value);

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    const result = value.map((item) => redactValue(item, seen));
    seen.delete(value);
    return result;
  }

  if (typeof value.toObject === "function") {
    try {
      const objectValue = value.toObject({
        depopulate: true,
        flattenMaps: true,
        virtuals: false,
      });
      const result = redactValue(objectValue, seen);
      seen.delete(value);
      return result;
    } catch {
      seen.delete(value);
      return "[Unserializable]";
    }
  }

  const result = {};

  for (const key of Object.keys(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = "[REDACTED]";
    } else {
      const redacted = redactValue(value[key], seen);
      if (redacted !== undefined) result[key] = redacted;
    }
  }

  seen.delete(value);
  return result;
};

const getRequestMetadata = (request) => {
  const source = request || {};

  return {
    requestId: source.headers?.["x-request-id"] || source.id,
    method: source.method,
    path: source.originalUrl || source.url,
    ipAddress: source.ip,
    userAgent: source.headers?.["user-agent"],
  };
};

const recordAudit = async (payload = {}) => {
  try {
    const actor = payload.actor || payload.request?.user || null;
    const action = typeof payload.action === "string" ? payload.action.trim() : "";
    const entityType = typeof payload.entityType === "string" ? payload.entityType.trim() : "";
    const requestMetadata = getRequestMetadata(payload.request);
    const actorId = typeof actor === "string"
      ? actor
      : actor?._id || actor?.id || payload.actorId;

    if (!action || !entityType) return null;

    return await AuditLog.create({
      actorId: normalizeObjectId(actorId),
      actorRole: (typeof actor === "object" && actor?.role) || payload.actorRole || "SYSTEM",
      actorName: actor?.name,
      actorEmail: actor?.email,
      action,
      entityType,
      entityId: normalizeObjectId(payload.entityId),
      oldValue: redactValue(payload.oldValue),
      newValue: redactValue(payload.newValue),
      metadata: redactValue(payload.metadata),
      requestId: requestMetadata.requestId,
      method: requestMetadata.method,
      path: requestMetadata.path,
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
    });
  } catch {
    return null;
  }
};

const listAuditLogsService = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    actorId,
    action,
    entityType,
    entityId,
    fromDate,
    toDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;
  const filter = {};

  if (actorId) filter.actorId = actorId;
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = fromDate;
    if (toDate) filter.createdAt.$lte = toDate;
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
  const [auditLogs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate("actorId", "name email role workshopId")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    auditLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAuditLogService = async (auditLogId) => {
  if (!mongoose.Types.ObjectId.isValid(auditLogId)) return null;

  return AuditLog.findById(auditLogId)
    .populate("actorId", "name email role workshopId")
    .lean();
};

module.exports = {
  recordAudit,
  recordAuditLog: recordAudit,
  listAuditLogsService,
  getAuditLogService,
};
