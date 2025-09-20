// tests/mocks/alert.js
export const Alert = {
  find: async (filter) => {
    const mockAlerts = [
      {
        _id: "alert-1",
        type: "critical",
        title: "Server Down",
        message: "Server instance is not responding",
        source: "health_check",
        userId: filter.userId,
        status: "active",
        createdAt: new Date(),
        loadBalancerId: "lb-123"
      },
      {
        _id: "alert-2", 
        type: "warning",
        title: "High Latency",
        message: "Response time is above threshold",
        source: "metrics",
        userId: filter.userId,
        status: "acknowledged",
        createdAt: new Date()
      }
    ];
    
    return {
      populate: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => mockAlerts.filter(alert => {
              if (filter.status && filter.status !== "all") {
                return alert.status === filter.status;
              }
              if (filter.type && filter.type !== "all") {
                return alert.type === filter.type;
              }
              return true;
            })
          })
        })
      })
    };
  },

  findOne: async (filter) => {
    if (filter._id === "valid-alert-id") {
      return {
        _id: "valid-alert-id",
        type: "critical",
        title: "Test Alert",
        message: "Test alert message",
        source: "test",
        userId: filter.userId,
        status: "active",
        acknowledge: async function(userId) {
          this.status = "acknowledged";
          this.acknowledgedBy = userId;
          this.acknowledgedAt = new Date();
          return this;
        },
        resolve: async function(userId) {
          this.status = "resolved";
          this.resolvedBy = userId;
          this.resolvedAt = new Date();
          return this;
        },
        populate: function() { return this; }
      };
    }
    
    if (filter._id === "resolved-alert-id") {
      return {
        _id: "resolved-alert-id",
        status: "resolved",
        userId: filter.userId
      };
    }
    
    return null;
  },

  findOneAndDelete: async (filter) => {
    if (filter._id === "valid-alert-id") {
      return {
        _id: "valid-alert-id",
        title: "Deleted Alert"
      };
    }
    return null;
  },

  countDocuments: async (filter) => {
    return 10; // Mock total count
  },

  aggregate: async (pipeline) => {
    return [{
      total: 10,
      critical: 3,
      warning: 4,
      active: 5,
      acknowledged: 3,
      resolved: 2
    }];
  },

  updateMany: async (filter, updateData) => {
    return {
      modifiedCount: filter._id?.$in?.length || 0
    };
  },

  createSystemAlert: async (alertData) => {
    return {
      _id: "system-alert-id",
      ...alertData,
      createdAt: new Date()
    };
  }
};

// Mock Alert constructor for new Alert()
Alert.prototype = {
  save: async function() { 
    this._id = "new-alert-id";
    this.createdAt = new Date();
    return this; 
  }
};

// Mock Alert constructor function
export function AlertConstructor(data) {
  Object.assign(this, data);
  this.save = Alert.prototype.save;
}

Alert.constructor = AlertConstructor;