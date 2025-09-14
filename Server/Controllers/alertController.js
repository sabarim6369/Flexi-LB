import Alert from "../Models/Alert.js";
import LoadBalancer from "../Models/LoadBalancer.js";

// Get all alerts for a user
export const getAlerts = async (c) => {
  try {
    const userId = c.get("userId");
    const { status, type, page = 1, limit = 50 } = c.req.query();

    // Build filter object
    const filter = { userId };
    if (status && status !== "all") filter.status = status;
    if (type && type !== "all") filter.type = type;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch alerts with pagination
    const alerts = await Alert.find(filter)
      .populate("loadBalancerId", "name endpoint")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Alert.countDocuments(filter);

    // Get alert statistics
    const stats = await Alert.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ["$type", "critical"] }, 1, 0] }
          },
          warning: {
            $sum: { $cond: [{ $eq: ["$type", "warning"] }, 1, 0] }
          },
          active: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          acknowledged: {
            $sum: { $cond: [{ $eq: ["$status", "acknowledged"] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] }
          }
        }
      }
    ]);

    return c.json({
      success: true,
      alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || {
        total: 0,
        critical: 0,
        warning: 0,
        active: 0,
        acknowledged: 0,
        resolved: 0
      }
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return c.json({ success: false, error: "Failed to fetch alerts" }, 500);
  }
};

// Get single alert by ID
export const getAlert = async (c) => {
  try {
    const userId = c.get("userId");
    const { id } = c.req.param();

    const alert = await Alert.findOne({ _id: id, userId })
      .populate("loadBalancerId", "name endpoint")
      .populate("acknowledgedBy", "username")
      .populate("resolvedBy", "username");

    if (!alert) {
      return c.json({ success: false, error: "Alert not found" }, 404);
    }

    return c.json({ success: true, alert });
  } catch (error) {
    console.error("Error fetching alert:", error);
    return c.json({ success: false, error: "Failed to fetch alert" }, 500);
  }
};

// Create new alert
export const createAlert = async (c) => {
  try {
    const userId = c.get("userId");
    const { type, title, message, source, loadBalancerId, metadata, severity } = await c.req.json();

    // Validate required fields
    if (!type || !title || !message || !source) {
      return c.json({ 
        success: false, 
        error: "Missing required fields: type, title, message, source" 
      }, 400);
    }

    // Get load balancer name if loadBalancerId is provided
    let loadBalancerName = null;
    if (loadBalancerId) {
      const lb = await LoadBalancer.findById(loadBalancerId);
      if (lb) {
        loadBalancerName = lb.name;
      }
    }

    const alert = new Alert({
      type,
      title,
      message,
      source,
      userId,
      loadBalancerId: loadBalancerId || undefined,
      loadBalancerName,
      metadata: metadata || {},
      severity: severity || 3
    });

    await alert.save();

    return c.json({ 
      success: true, 
      alert,
      message: "Alert created successfully" 
    }, 201);
  } catch (error) {
    console.error("Error creating alert:", error);
    return c.json({ success: false, error: "Failed to create alert" }, 500);
  }
};

// Acknowledge alert
export const acknowledgeAlert = async (c) => {
  try {
    const userId = c.get("userId");
    const { id } = c.req.param();

    const alert = await Alert.findOne({ _id: id, userId });
    if (!alert) {
      return c.json({ success: false, error: "Alert not found" }, 404);
    }

    if (alert.status !== "active") {
      return c.json({ 
        success: false, 
        error: "Only active alerts can be acknowledged" 
      }, 400);
    }

    await alert.acknowledge(userId);

    return c.json({ 
      success: true, 
      alert,
      message: "Alert acknowledged successfully" 
    });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return c.json({ success: false, error: "Failed to acknowledge alert" }, 500);
  }
};

// Resolve alert
export const resolveAlert = async (c) => {
  try {
    const userId = c.get("userId");
    const { id } = c.req.param();

    const alert = await Alert.findOne({ _id: id, userId });
    if (!alert) {
      return c.json({ success: false, error: "Alert not found" }, 404);
    }

    if (alert.status === "resolved") {
      return c.json({ 
        success: false, 
        error: "Alert is already resolved" 
      }, 400);
    }

    await alert.resolve(userId);

    return c.json({ 
      success: true, 
      alert,
      message: "Alert resolved successfully" 
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    return c.json({ success: false, error: "Failed to resolve alert" }, 500);
  }
};

// Delete alert
export const deleteAlert = async (c) => {
  try {
    const userId = c.get("userId");
    const { id } = c.req.param();

    const alert = await Alert.findOneAndDelete({ _id: id, userId });
    if (!alert) {
      return c.json({ success: false, error: "Alert not found" }, 404);
    }

    return c.json({ 
      success: true, 
      message: "Alert deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return c.json({ success: false, error: "Failed to delete alert" }, 500);
  }
};

// Bulk operations
export const bulkUpdateAlerts = async (c) => {
  try {
    const userId = c.get("userId");
    const { alertIds, action } = await c.req.json();

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return c.json({ 
        success: false, 
        error: "alertIds must be a non-empty array" 
      }, 400);
    }

    let updateData = {};
    if (action === "acknowledge") {
      updateData = { 
        status: "acknowledged", 
        acknowledgedAt: new Date(), 
        acknowledgedBy: userId 
      };
    } else if (action === "resolve") {
      updateData = { 
        status: "resolved", 
        resolvedAt: new Date(), 
        resolvedBy: userId 
      };
    } else {
      return c.json({ 
        success: false, 
        error: "Invalid action. Use 'acknowledge' or 'resolve'" 
      }, 400);
    }

    const result = await Alert.updateMany(
      { _id: { $in: alertIds }, userId },
      updateData
    );

    return c.json({ 
      success: true, 
      modifiedCount: result.modifiedCount,
      message: `${result.modifiedCount} alerts ${action}d successfully` 
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    return c.json({ success: false, error: "Failed to update alerts" }, 500);
  }
};

// Helper function to create system alerts (used by other services)
export const createSystemAlert = async (alertData) => {
  try {
    return await Alert.createSystemAlert(alertData);
  } catch (error) {
    console.error("Error creating system alert:", error);
    throw error;
  }
};