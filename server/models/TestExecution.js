const mongoose = require('mongoose');

const TestExecutionSchema = new mongoose.Schema({
  executionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  agent: {
    name: {
      type: String,
      required: true
    },
    adapter: {
      type: String,
      enum: ['http', 'openai', 'mock'],
      required: true
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  tests: [{
    type: String,
    enum: [
      'prompt-injection',
      'role-confusion',
      'system-prompt-extraction',
      'data-exfiltration',
      'jailbreaking',
      'tool-abuse',
      'context-manipulation',
      'api-abuse',
      'privilege-escalation',
      'input-validation',
      'output-sanitization',
      'performance-impact'
    ]
  }],
  runOptions: {
    parallel: {
      type: Boolean,
      default: true
    },
    timeout: {
      type: Number,
      default: 30000
    }
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  results: {
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low']
    },
    summary: String,
    tests: [{
      name: String,
      passed: Boolean,
      severity: String,
      evidence: String,
      duration: Number,
      timestamp: Date
    }],
    remediation: [{
      title: String,
      description: String,
      priority: String,
      estimatedEffort: String,
      category: String
    }]
  },
  logs: [{
    level: {
      type: String,
      enum: ['info', 'warn', 'error', 'debug']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    testName: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: Date,
  completedAt: Date,
  error: String
}, {
  timestamps: true
});

// Index for efficient querying
TestExecutionSchema.index({ createdBy: 1, status: 1 });
TestExecutionSchema.index({ 'agent.name': 1 });
TestExecutionSchema.index({ 'results.severity': 1 });

// Virtual for duration calculation
TestExecutionSchema.virtual('duration').get(function() {
  if (this.startedAt && this.completedAt) {
    return this.completedAt - this.startedAt;
  }
  return null;
});

// Method to add log entry
TestExecutionSchema.methods.addLog = function(level, message, testName = null) {
  this.logs.push({
    level,
    message,
    testName,
    timestamp: new Date()
  });
  return this.save();
};

// Method to update test result
TestExecutionSchema.methods.updateTestResult = function(testName, result) {
  const existingTest = this.results.tests.find(test => test.name === testName);
  if (existingTest) {
    Object.assign(existingTest, result);
  } else {
    this.results.tests.push({
      name: testName,
      ...result,
      timestamp: new Date()
    });
  }
  return this.save();
};

// Method to calculate overall status
TestExecutionSchema.methods.calculateStatus = function() {
  if (this.status === 'failed') return 'failed';
  if (this.status === 'pending') return 'pending';
  if (this.status === 'running') return 'running';
  
  const totalTests = this.tests.length;
  const completedTests = this.results.tests.length;
  
  if (completedTests === totalTests) {
    this.status = 'completed';
    this.completedAt = new Date();
  } else {
    this.status = 'running';
  }
  
  return this.status;
};

// Static method to get execution statistics
TestExecutionSchema.statics.getStatistics = function(userId, timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  return this.aggregate([
    {
      $match: {
        createdBy: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalExecutions: { $sum: 1 },
        completedExecutions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedExecutions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        averageScore: { $avg: '$results.score' },
        criticalCount: {
          $sum: { $cond: [{ $eq: ['$results.severity', 'Critical'] }, 1, 0] }
        },
        highCount: {
          $sum: { $cond: [{ $eq: ['$results.severity', 'High'] }, 1, 0] }
        },
        mediumCount: {
          $sum: { $cond: [{ $eq: ['$results.severity', 'Medium'] }, 1, 0] }
        },
        lowCount: {
          $sum: { $cond: [{ $eq: ['$results.severity', 'Low'] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('TestExecution', TestExecutionSchema);
